
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseURLEncoded(body: string): Record<string, string> {
  return body.split("&").reduce((acc, pair) => {
    const [k, v] = pair.split("=");
    if (k) {
      acc[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, " ")) : "";
    }
    return acc;
  }, {} as Record<string, string>);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw IPN body:", rawBody);

    // Compose validation payload (append &cmd=_notify-validate)
    const validationPayload = rawBody + "&cmd=_notify-validate";
    const paypalRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validationPayload,
    });
    const verification = await paypalRes.text();
    console.log("PayPal IPN verification response:", verification);

    if (verification !== "VERIFIED") {
      console.warn("IPN verification failed:", verification);
      return new Response("INVALID", { status: 400, headers: corsHeaders });
    }

    // Parse the IPN data
    const params = parseURLEncoded(rawBody);
    console.log("Parsed IPN params:", params);

    // Check for completed payment
    if (params["payment_status"] === "Completed") {
      // Prepare Supabase client (service role env vars should already be set)
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase env vars');
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Extract info
      const donationId = params["custom"] || null; // donation ID passed in the custom field
      const payerEmail = params["payer_email"];
      const txnId = params["txn_id"];
      const amount = Number(params["mc_gross"]);
      const currency = params["mc_currency"] || "EUR";

      console.log("Processing payment:", { donationId, payerEmail, txnId, amount, currency });

      // Verify amount is at least 12 EUR
      if (amount < 12) {
        console.warn(`Payment amount ${amount} is less than required 12 EUR`);
        return new Response("INSUFFICIENT_AMOUNT", { status: 400, headers: corsHeaders });
      }

      let result;
      if (donationId) {
        // Update the existing donation record
        result = await supabase
          .from("donations")
          .update({
            status: "completed",
            paypal_transaction_id: txnId,
            amount: amount,
            email: payerEmail
          })
          .eq("id", donationId);
        console.log(`[IPN] Updated donation ${donationId}:`, result);
      } else {
        // Create a new donation record (fallback for donations without custom field)
        const { data: newDonation, error: insertError } = await supabase
          .from("donations")
          .insert({
            status: "completed",
            paypal_transaction_id: txnId,
            amount: amount,
            email: payerEmail,
            document_id: null // We don't know which document this is for
          })
          .select()
          .single();
        
        result = { error: insertError };
        console.log("[IPN] Created new donation:", newDonation);
      }

      if (result.error) {
        console.error("[IPN] Supabase error:", result.error);
        return new Response("DB ERROR: " + result.error.message, { status: 500, headers: corsHeaders });
      }

      console.log(`[IPN] Successfully processed payment ${txnId} for amount ${amount} EUR`);
      return new Response("OK: VERIFIED+PROCESSED", { status: 200, headers: corsHeaders });
    } else {
      // Not a completed payment
      console.log(`IPN payment_status not handled: ${params["payment_status"]}`);
      return new Response("IGNORED: payment_status not handled", { status: 200, headers: corsHeaders });
    }
  } catch (err) {
    console.error("PayPal IPN error:", err);
    return new Response("ERROR:" + err.message, { status: 500, headers: corsHeaders });
  }
});

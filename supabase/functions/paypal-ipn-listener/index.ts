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
      const donationId = params["custom"] || null; // As before
      const payerEmail = params["payer_email"];
      const txnId = params["txn_id"];
      const amount = Number(params["mc_gross"]);
      const currency = params["mc_currency"] || "EUR";

      // Retrieve the link_token if donationId was provided (for convenience)
      let link_token = null;
      if (donationId) {
        const { data: existingDonation } = await supabase
          .from("donations")
          .select("link_token")
          .eq("id", donationId)
          .maybeSingle();
        link_token = existingDonation?.link_token || null;
      }

      // Prepare upsert data
      let upsertData: any = {
        status: "completed",
        paypal_transaction_id: txnId,
        amount,
        email: payerEmail,
      };
      if (donationId) upsertData.id = donationId;
      if (link_token) upsertData.link_token = link_token;

      // Try to update by PayPal txn_id, fall back to id (if custom field provided)
      let result;
      if (donationId) {
        // If we know the local donationId (custom field): update it
        result = await supabase
          .from("donations")
          .update(upsertData)
          .eq("id", donationId);
        console.log(`[IPN] Updated donation ${donationId}:`, result);
      } else if (txnId) {
        // Try to update by paypal_transaction_id
        result = await supabase
          .from("donations")
          .update(upsertData)
          .eq("paypal_transaction_id", txnId);
        console.log(`[IPN] Updated by txn_id=${txnId}:`, result);
      } else {
        // Else, just insert with email/amount (not ideal—there's no way to link to document!)
        upsertData.status = "unlinked";
        result = await supabase.from("donations").insert(upsertData);
        console.log("[IPN] Inserted fallback donation:", result);
      }

      if (result.error) {
        console.error("[IPN] Supabase error:", result.error);
        return new Response("DB ERROR: " + result.error.message, { status: 500, headers: corsHeaders });
      }

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

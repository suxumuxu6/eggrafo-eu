
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw IPN body:", rawBody);

    // Compose validation payload (append &cmd=_notify-validate, per PayPal docs)
    const validationPayload = rawBody + "&cmd=_notify-validate";

    // Validate with PayPal (production endpoint!)
    const response = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validationPayload,
    });
    const verification = await response.text();

    console.log("PayPal IPN verification response:", verification);

    // Respond to valid/invalid
    if (verification === "VERIFIED") {
      // Optionally: parse key info, update DB, etc.
      console.log("IPN VERIFIED");
      // You could extract info (like txn_id, custom ref, payment_status) from rawBody here
      // and perform database updates.
      return new Response("OK: VERIFIED", { status: 200, headers: corsHeaders });
    } else if (verification === "INVALID") {
      console.warn("IPN INVALID");
      return new Response("INVALID", { status: 400, headers: corsHeaders });
    } else {
      console.error("Unexpected validation response:", verification);
      return new Response("ERROR", { status: 500, headers: corsHeaders });
    }
  } catch (err) {
    console.error("PayPal IPN error:", err);
    return new Response("ERROR:" + err.message, { status: 500, headers: corsHeaders });
  }
});

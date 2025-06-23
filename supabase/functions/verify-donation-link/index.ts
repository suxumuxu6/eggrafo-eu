
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase env vars');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find donation by link_token
    const { data: donation, error } = await supabase
      .from("donations")
      .select("id, status, amount, email, document_id, expires_at")
      .eq("link_token", token)
      .maybeSingle();

    if (error || !donation) {
      return new Response(JSON.stringify({
        success: false,
        error: "Donation not found"
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if donation is completed
    if (donation.status !== "completed") {
      return new Response(JSON.stringify({
        success: false,
        error: "Donation not completed"
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if link has expired
    const now = new Date();
    const expiresAt = new Date(donation.expires_at);
    
    if (now > expiresAt) {
      return new Response(JSON.stringify({
        success: false,
        error: "Download link has expired"
      }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up the document details if document_id is present
    let document = null;
    if (donation.document_id) {
      const { data: docData } = await supabase
        .from("documents")
        .select("id, title, file_url")
        .eq("id", donation.document_id)
        .maybeSingle();
      document = docData || null;
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Donation verified",
      donation: {
        ...donation,
        expires_at: donation.expires_at
      },
      document,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Verification error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error during verification",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

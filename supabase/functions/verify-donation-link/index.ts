
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
      .select("id, status, amount, email, document_id")
      .eq("link_token", token)
      .maybeSingle();

    if (error || !donation) {
      return new Response(JSON.stringify({
        success: false,
        error: "Donation not found"
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only allow if status is completed
    if (donation.status !== "completed") {
      return new Response(JSON.stringify({
        success: false,
        error: "Donation not completed"
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Optionally, you can now look up the document details if document_id is present
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
      donation,
      document,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

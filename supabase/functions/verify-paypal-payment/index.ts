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
    const { paymentId, payerId, donationId } = await req.json();
    
    console.log('Verifying PayPal payment:', { paymentId, payerId, donationId });

    if (!paymentId || !payerId || !donationId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required parameters"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PayPal credentials
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const paypalBaseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Execute the payment
    const executeResponse = await fetch(`${paypalBaseUrl}/v1/payments/payment/${paymentId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payer_id: payerId
      })
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      console.error('PayPal execute payment failed:', errorText);
      throw new Error('Failed to execute PayPal payment');
    }

    const executeData = await executeResponse.json();
    console.log('PayPal payment executed:', executeData);

    if (executeData.state !== 'approved') {
      throw new Error('Payment not approved');
    }

    // Update donation as completed with proper expiry maintained
    const { data: updatedDonation, error: updateError } = await supabase
      .from('donations')
      .update({
        status: 'completed',
        paypal_transaction_id: executeData.transactions[0].related_resources[0].sale.id,
        // Keep the original expires_at - don't reset it
      })
      .eq('id', donationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw new Error('Failed to update donation status');
    }

    console.log('Donation updated successfully:', {
      id: updatedDonation.id,
      status: updatedDonation.status,
      expires_at: updatedDonation.expires_at
    });

    return new Response(JSON.stringify({
      success: true,
      donation: updatedDonation
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in verify-paypal-payment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

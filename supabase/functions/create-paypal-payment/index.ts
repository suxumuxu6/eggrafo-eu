
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
    const { userData, documentId, documentTitle, donationAmount } = await req.json();

    if (!userData?.email || !userData?.name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing user data" 
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

    // Generate a unique link token
    const linkToken = crypto.randomUUID();
    
    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create donation record with proper expiry
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        email: userData.email,
        amount: donationAmount,
        status: 'pending',
        document_id: documentId || null,
        link_token: linkToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (donationError) {
      console.error('Error creating donation:', donationError);
      throw new Error('Failed to create donation record');
    }

    console.log('Created donation with expiry:', {
      id: donation.id,
      expires_at: donation.expires_at
    });

    // PayPal API configuration
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

    // Create PayPal payment
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      transactions: [{
        amount: {
          total: donationAmount.toString(),
          currency: 'EUR'
        },
        description: `Δωρεά για ${documentTitle || 'έγγραφο'}`,
        custom: donation.id
      }],
      redirect_urls: {
        return_url: `https://eggrafo.work/payment-success`,
        cancel_url: `https://eggrafo.work/payment-cancel`
      }
    };

    const paymentResponse = await fetch(`${paypalBaseUrl}/v1/payments/payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment)
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('PayPal payment creation failed:', errorText);
      throw new Error('Failed to create PayPal payment');
    }

    const paymentData = await paymentResponse.json();
    console.log('PayPal payment created:', paymentData.id);

    // Update donation with PayPal payment ID
    await supabase
      .from('donations')
      .update({ paypal_payment_id: paymentData.id })
      .eq('id', donation.id);

    // Find approval URL
    const approvalUrl = paymentData.links.find((link: any) => link.rel === 'approval_url')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL found in PayPal response');
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentData.id,
      approvalUrl,
      donationId: donation.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in create-paypal-payment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

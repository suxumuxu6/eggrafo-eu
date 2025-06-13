
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userData, documentId, documentTitle } = await req.json();
    
    console.log('Creating PayPal payment for:', { userData, documentId, documentTitle });

    // Get PayPal credentials from secrets
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('PayPal credentials missing:', { clientId: !!clientId, clientSecret: !!clientSecret });
      throw new Error('PayPal credentials not configured');
    }

    console.log('PayPal credentials available:', { clientId: clientId.substring(0, 10) + '...' });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create donation record
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        email: userData.email,
        amount: 20,
        document_id: documentId,
        status: 'pending'
      })
      .select()
      .single();

    if (donationError) {
      console.error('Error creating donation:', donationError);
      throw donationError;
    }

    console.log('Created donation record:', donation.id);

    // PayPal sandbox API endpoints
    const tokenUrl = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
    const paymentUrl = 'https://api-m.sandbox.paypal.com/v1/payments/payment';

    // Get PayPal access token
    console.log('Requesting PayPal access token...');
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token request failed:', tokenData);
      throw new Error(`PayPal authentication failed: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    console.log('Got PayPal access token successfully');

    // Create PayPal payment
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${req.headers.get('origin')}/payment-success?donationId=${donation.id}`,
        cancel_url: `${req.headers.get('origin')}/payment-cancel`
      },
      transactions: [{
        amount: {
          total: '20.00',
          currency: 'EUR'
        },
        description: `Access to document: ${documentTitle}`,
        custom: donation.id // Store donation ID for verification
      }]
    };

    console.log('Creating PayPal payment with payload:', JSON.stringify(payment, null, 2));

    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payment)
    });

    const paymentData = await paymentResponse.json();
    console.log('Payment response status:', paymentResponse.status);
    console.log('PayPal payment response:', JSON.stringify(paymentData, null, 2));

    if (!paymentResponse.ok) {
      console.error('Payment creation failed:', paymentData);
      throw new Error(`PayPal payment creation failed: ${paymentData.message || paymentData.error_description || 'Unknown error'}`);
    }

    if (!paymentData.id) {
      throw new Error('No payment ID returned from PayPal');
    }

    // Find approval URL
    const approvalUrl = paymentData.links?.find((link: any) => link.rel === 'approval_url')?.href;

    if (!approvalUrl) {
      console.error('No approval URL found in links:', paymentData.links);
      throw new Error('No approval URL returned from PayPal');
    }

    console.log('Payment created successfully:', { paymentId: paymentData.id, approvalUrl });

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: paymentData.id,
        approvalUrl,
        donationId: donation.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

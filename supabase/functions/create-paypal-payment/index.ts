
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
      throw new Error('PayPal credentials not configured');
    }

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

    // Get PayPal access token
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Got PayPal access token');

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
        description: `Access to document: ${documentTitle}`
      }]
    };

    const paymentResponse = await fetch('https://api-m.sandbox.paypal.com/v1/payments/payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payment)
    });

    const paymentData = await paymentResponse.json();
    console.log('PayPal payment created:', paymentData);

    if (!paymentData.id) {
      throw new Error('Failed to create PayPal payment');
    }

    // Find approval URL
    const approvalUrl = paymentData.links?.find((link: any) => link.rel === 'approval_url')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL returned from PayPal');
    }

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

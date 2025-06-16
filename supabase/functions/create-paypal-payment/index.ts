
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
    const { userData, documentId, documentTitle, donationAmount } = await req.json();
    
    console.log('Creating PayPal payment for:', { userData, documentId, documentTitle });

    // Get PayPal credentials from secrets
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('PayPal credentials missing:', { clientId: !!clientId, clientSecret: !!clientSecret });
      throw new Error('PayPal credentials not configured');
    }

    console.log('PayPal credentials available');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a unique, secure link_token
    function generateLinkToken(len = 32) {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let token = "";
      for (let i = 0; i < len; i++) {
        token += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return token;
    }

    // Insert a new donation record with link_token
    const link_token = generateLinkToken();
    const { data: donationData, error: donationError } = await supabase
      .from('donations')
      .insert({
        amount: donationAmount,
        document_id: documentId || null,
        email: userData.email,
        status: 'pending',
        link_token,
      })
      .select()
      .single();

    if (donationError) {
      console.error('Error creating donation:', donationError);
      throw donationError;
    }

    console.log('Created donation record:', donationData.id);

    // Prepare amount as a string in xx.00 format
    const donationAmountStr = Number.isFinite(donationAmount)
      ? Number(donationAmount).toFixed(2)
      : "12.00";

    // Use PayPal LIVE API endpoints
    const tokenUrl = 'https://api-m.paypal.com/v1/oauth2/token';
    const paymentUrl = 'https://api-m.paypal.com/v1/payments/payment';

    console.log('Getting PayPal access token...');
    
    // Get PayPal access token
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

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('PayPal token error:', tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          step: 'token',
          error: tokenData.error_description || tokenData.error || 'PayPal authentication failed',
          details: tokenData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('PayPal access token acquired');

    // Get the origin for return URLs - ensure we use the correct domain
    const origin = req.headers.get('origin') || 'https://c6e46c6a-7177-4585-90f1-39fed8809a34.lovableproject.com';
    
    // Create PayPal payment with simplified structure
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${origin}/payment-success?donationId=${donationData.id}`,
        cancel_url: `${origin}/payment-cancel`
      },
      transactions: [{
        amount: {
          total: donationAmountStr,
          currency: 'EUR'
        },
        description: `Donation for Document Access - ${documentTitle}`,
        custom: donationData.id
      }]
    };

    console.log('Creating PayPal payment with payload:', JSON.stringify(payment, null, 2));

    // Create PayPal payment
    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payment)
    });

    const paymentData = await paymentResponse.json();
    console.log('PayPal payment response status:', paymentResponse.status);
    console.log('PayPal payment response:', paymentData);

    if (!paymentResponse.ok) {
      console.error('PayPal payment creation failed:', paymentData);
      return new Response(
        JSON.stringify({
          success: false,
          step: 'payment',
          error: paymentData.message || paymentData.error_description || 'PayPal payment creation error',
          name: paymentData.name,
          details: paymentData
        }),
        { status: paymentResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paymentData.id) {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'payment-missing-id',
          error: 'No payment ID returned from PayPal',
          details: paymentData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find approval URL
    const approvalUrl = paymentData.links?.find((link: any) => link.rel === 'approval_url')?.href;

    if (!approvalUrl) {
      console.error('No approval URL found in links:', paymentData.links);
      throw new Error('No approval URL returned from PayPal');
    }

    const paymentId = paymentData.id;

    // Update donation record with PayPal payment ID
    await supabase
      .from('donations')
      .update({
        paypal_transaction_id: paymentId
      })
      .eq('id', donationData.id);

    console.log('Payment created successfully:', { paymentId, approvalUrl });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        approvalUrl,
        donationId: donationData.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

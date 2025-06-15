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

    console.log('PayPal credentials available:', { clientId: clientId.substring(0, 10) + '...' });

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

    // Prepare amount as a string in xx.00 format (PayPal expects string, e.g. '12.00')
    const donationAmountStr = Number.isFinite(donationAmount)
      ? Number(donationAmount).toFixed(2)
      : "12.00";

    // --- [PayPal LIVE API endpoints] ---
    const tokenUrl = 'https://api-m.paypal.com/v1/oauth2/token';
    const paymentUrl = 'https://api-m.paypal.com/v1/payments/payment';

    // --- DEBUG: Log credentials, environment, and endpoints ---
    console.log('PayPal credentials:', { clientId: clientId?.slice(0, 8), clientSecret: clientSecret ? '****' : null });
    console.log('PayPal endpoint:', tokenUrl, paymentUrl);

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
    console.log('Token response:', tokenResponse.status, tokenData);

    if (!tokenResponse.ok || !tokenData.access_token) {
      // Expose all error info!
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

    // Get the origin for return URLs
    const origin = req.headers.get('origin') || 'https://c6e46c6a-7177-4585-90f1-39fed8809a34.lovableproject.com';

    // Create PayPal payment with dynamic amount from user input
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${origin}/payment-success`,
        cancel_url: `${origin}/payment-cancel`
      },
      transactions: [{
        amount: {
          total: donationAmountStr,
          currency: 'EUR'
        },
        description: `Document Access: ${documentTitle}`,
        custom: donationData.id,
        item_list: {
          items: [{
            name: `Access to: ${documentTitle}`,
            description: 'Document access fee',
            quantity: 1, // Make sure this is integer!
            price: donationAmountStr,
            currency: 'EUR'
          }]
        }
      }]
    };

    console.log('Creating PayPal payment with improved payload:', JSON.stringify(payment, null, 2));

    // --- Payment creation with robust error details ---
    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payment)
    });

    const paymentData = await paymentResponse.json();
    console.log('CreatePayment status:', paymentResponse.status);
    console.log('CreatePayment response:', paymentData);

    if (!paymentResponse.ok) {
      // Expose detailed error
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

    // *** FIX: Define paymentId variable here ***
    const paymentId = paymentData.id;

    console.log('Payment created successfully:', { paymentId, approvalUrl });

    // Return donation link in the API response
    const donationLink = `https://${Deno.env.get("SUPABASE_PROJECT_REF") || "YOUR_PROJECT_REF"}.lovableproject.com/donation-link?token=${link_token}`;

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        approvalUrl,
        donationId: donationData.id,
        donationLink,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

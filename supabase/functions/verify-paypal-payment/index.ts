
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
    const { paymentId, payerId, donationId } = await req.json();
    
    console.log('Verifying PayPal payment:', { paymentId, payerId, donationId });

    // Get PayPal credentials from secrets
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get PayPal access token (using LIVE endpoint)
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
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
      throw new Error('Failed to get PayPal access token: ' + (tokenData.error_description || tokenData.error));
    }

    const accessToken = tokenData.access_token;
    console.log('Got PayPal access token');

    // First, get the payment details to check current state
    const paymentResponse = await fetch(`https://api-m.paypal.com/v1/payments/payment/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await paymentResponse.json();
    console.log('PayPal payment data:', paymentData);

    if (!paymentResponse.ok) {
      throw new Error('Failed to get payment details: ' + (paymentData.message || paymentData.error_description));
    }

    // Check if payment needs to be executed
    if (paymentData.state === 'created' && payerId) {
      console.log('Payment is in created state, executing payment...');
      
      // Execute the payment
      const executeResponse = await fetch(`https://api-m.paypal.com/v1/payments/payment/${paymentId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payer_id: payerId
        })
      });

      const executeData = await executeResponse.json();
      console.log('Execute payment response:', executeResponse.status, executeData);

      if (!executeResponse.ok) {
        throw new Error('Failed to execute payment: ' + (executeData.message || executeData.error_description));
      }

      // Use the executed payment data for validation
      const executedPayment = executeData;
      
      // Check if payment is approved and completed
      const isPaymentValid = executedPayment.state === 'approved' && 
                            executedPayment.transactions && 
                            executedPayment.transactions.length > 0 &&
                            parseFloat(executedPayment.transactions[0].amount.total) >= 12;

      if (!isPaymentValid) {
        console.error('Payment validation failed:', {
          state: executedPayment.state,
          hasTransactions: !!executedPayment.transactions?.length,
          amount: executedPayment.transactions?.[0]?.amount?.total
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Payment not valid or insufficient amount' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update donation record
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'completed',
          paypal_transaction_id: paymentId
        })
        .eq('id', donationId);

      if (updateError) {
        console.error('Error updating donation:', updateError);
        throw updateError;
      }

      console.log('Payment executed and donation updated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment executed and verified successfully',
          paymentId,
          amount: executedPayment.transactions[0].amount.total
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (paymentData.state === 'approved') {
      console.log('Payment is already approved');
      
      // Payment is already approved, just verify amount
      const isPaymentValid = paymentData.transactions && 
                            paymentData.transactions.length > 0 &&
                            parseFloat(paymentData.transactions[0].amount.total) >= 12;

      if (!isPaymentValid) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payment not valid or insufficient amount' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update donation record
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'completed',
          paypal_transaction_id: paymentId
        })
        .eq('id', donationId);

      if (updateError) {
        console.error('Error updating donation:', updateError);
        throw updateError;
      }

      console.log('Payment verified and donation updated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified successfully',
          paymentId,
          amount: paymentData.transactions[0].amount.total
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      console.error('Payment is in unexpected state:', paymentData.state);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payment is in unexpected state: ${paymentData.state}` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

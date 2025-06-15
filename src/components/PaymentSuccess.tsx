
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve params
  let paymentId = searchParams.get('paymentId');
  let payerId = searchParams.get('PayerID');
  let donationId = searchParams.get('donationId');

  // PayPal sometimes returns only token, not paymentId, so fallback to token
  if (!paymentId) {
    const token = searchParams.get('token');
    if (token) {
      paymentId = token;
    }
  }

  // If donationId is missing, try to get from localStorage ("pendingDonation")
  if (!donationId) {
    try {
      const pending = localStorage.getItem('pendingDonation');
      if (pending) {
        const obj = JSON.parse(pending);
        if (obj && obj.donationId) {
          donationId = obj.donationId;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (paymentId && payerId && donationId) {
      verifyPayment();
    } else {
      setError('Missing payment information');
      setVerifying(false);
    }
    // eslint-disable-next-line
  }, [paymentId, payerId, donationId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-paypal-payment', {
        body: {
          paymentId,
          payerId,
          donationId
        }
      });

      if (error) throw error;

      if (data.success) {
        setVerified(true);
        toast.success('Payment verified successfully! You now have access to the document.');
        
        // Store payment verification in localStorage for access validation
        localStorage.setItem('verifiedPayment', JSON.stringify({
          donationId,
          paymentId,
          timestamp: Date.now(),
          verified: true
        }));
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {verifying && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your PayPal payment...
            </p>
          </>
        )}

        {!verifying && verified && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your donation. You now have access to the document.
            </p>
            <Button onClick={handleReturnHome} className="w-full">
              Return to Documents
            </Button>
          </>
        )}

        {!verifying && error && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button onClick={handleReturnHome} variant="outline" className="w-full">
              Return to Documents
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

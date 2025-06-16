
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

  // Get parameters from URL
  const paymentId = searchParams.get('paymentId') || searchParams.get('token');
  const payerId = searchParams.get('PayerID');
  let donationId = searchParams.get('donationId');

  // If donationId is missing, try to get from localStorage
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
      console.log('No pending donation found in localStorage');
    }
  }

  useEffect(() => {
    console.log('PaymentSuccess params:', { paymentId, payerId, donationId });
    
    if (paymentId && payerId && donationId) {
      verifyPayment();
    } else if (paymentId && donationId) {
      // Sometimes PayerID might not be present immediately, try verification anyway
      verifyPayment();
    } else {
      setError('Missing payment information. Please try the payment process again.');
      setVerifying(false);
    }
  }, [paymentId, payerId, donationId]);

  const verifyPayment = async () => {
    try {
      console.log('Verifying payment with:', { paymentId, payerId, donationId });
      
      const { data, error } = await supabase.functions.invoke('verify-paypal-payment', {
        body: {
          paymentId,
          payerId,
          donationId
        }
      });

      console.log('Verification response:', data, error);

      if (error) {
        console.error('Verification error:', error);
        throw error;
      }

      // Handle if data is a string (sometimes returned by supabase.functions.invoke)
      let parsedData: any = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          throw new Error("Could not parse verification response");
        }
      }

      if (parsedData.success) {
        setVerified(true);
        toast.success('Payment verified successfully! You now have access to the document.');
        
        // Store payment verification in localStorage for access validation
        localStorage.setItem('verifiedPayment', JSON.stringify({
          donationId,
          paymentId,
          timestamp: Date.now(),
          verified: true
        }));

        // Clear pending donation from localStorage
        localStorage.removeItem('pendingDonation');
      } else {
        throw new Error(parsedData.error || 'Payment verification failed');
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
              Επιβεβαίωση Πληρωμής
            </h2>
            <p className="text-gray-600">
              Παρακαλώ περιμένετε ενώ επιβεβαιώνουμε την πληρωμή σας...
            </p>
          </>
        )}

        {!verifying && verified && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Η Πληρωμή Ολοκληρώθηκε!
            </h2>
            <p className="text-gray-600 mb-6">
              Σας ευχαριστούμε για τη δωρεά σας. Τώρα έχετε πρόσβαση στο έγγραφο.
            </p>
            <Button onClick={handleReturnHome} className="w-full bg-kb-blue hover:bg-kb-blue/90">
              Επιστροφή στα Έγγραφα
            </Button>
          </>
        )}

        {!verifying && error && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Αποτυχία Επιβεβαίωσης Πληρωμής
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-2">
              <Button onClick={handleReturnHome} className="w-full bg-kb-blue hover:bg-kb-blue/90">
                Επιστροφή στα Έγγραφα
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Δοκιμάστε Ξανά
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

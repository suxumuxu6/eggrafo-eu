
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

  useEffect(() => {
    // Check if there's a pending donation in localStorage
    const checkPendingDonation = () => {
      try {
        const pending = localStorage.getItem('pendingDonation');
        if (pending) {
          const donationData = JSON.parse(pending);
          console.log('Found pending donation:', donationData);
          
          // Start polling for payment completion
          pollForPaymentCompletion(donationData.donationId);
        } else {
          setError('Δεν βρέθηκε εκκρεμής πληρωμή. Παρακαλώ δοκιμάστε ξανά.');
          setVerifying(false);
        }
      } catch (e) {
        console.error('Error checking pending donation:', e);
        setError('Σφάλμα κατά την επαλήθευση της πληρωμής.');
        setVerifying(false);
      }
    };

    checkPendingDonation();
  }, []);

  const pollForPaymentCompletion = async (donationId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 30 seconds
    
    const checkPayment = async () => {
      try {
        console.log(`Checking payment status, attempt ${attempts + 1}`);
        
        const { data: donation, error } = await supabase
          .from('donations')
          .select('*')
          .eq('id', donationId)
          .single();

        if (error) {
          console.error('Error checking donation status:', error);
          throw error;
        }

        console.log('Donation status:', donation?.status);

        if (donation && donation.status === 'completed') {
          setVerified(true);
          toast.success('Η πληρωμή επιβεβαιώθηκε επιτυχώς! Τώρα έχετε πρόσβαση στο έγγραφο.');
          
          // Store payment verification in localStorage for access validation
          localStorage.setItem('verifiedPayment', JSON.stringify({
            donationId,
            paymentId: donation.paypal_transaction_id,
            timestamp: Date.now(),
            verified: true
          }));

          // Clear pending donation from localStorage
          localStorage.removeItem('pendingDonation');
          setVerifying(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Continue polling every 1 second
          setTimeout(checkPayment, 1000);
        } else {
          throw new Error('Η επαλήθευση της πληρωμής διήρκεσε πολύ. Παρακαλώ ελέγξτε το email σας ή επικοινωνήστε μαζί μας.');
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.message || 'Αποτυχία επαλήθευσης πληρωμής');
        setVerifying(false);
      }
    };

    checkPayment();
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
              Επαλήθευση Πληρωμής
            </h2>
            <p className="text-gray-600">
              Παρακαλώ περιμένετε ενώ επαλήθεύουμε την πληρωμή σας μέσω PayPal...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Αυτό μπορεί να διαρκέσει μέχρι 30 δευτερόλεπτα.
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
              Αποτυχία Επαλήθευσης Πληρωμής
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

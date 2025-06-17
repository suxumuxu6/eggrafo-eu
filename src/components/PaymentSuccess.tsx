
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Check if there's a pending donation in localStorage
    const checkPendingDonation = () => {
      try {
        const pending = localStorage.getItem('pendingDonation');
        if (pending) {
          const donationData = JSON.parse(pending);
          console.log('Found pending donation:', donationData);
          setUserEmail(donationData.email || '');
          
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
          toast.success('Η πληρωμή επιβεβαιώθηκε επιτυχώς! Ελέγξτε το email σας για το download link.');
          
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
            <div className="text-gray-600 mb-6 space-y-3">
              <p>Σας ευχαριστούμε για τη δωρεά σας!</p>
              
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm mb-1">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email εστάλη!</span>
                </div>
                <p className="text-xs text-green-700">
                  Στείλαμε download link στο {userEmail}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Το link λήγει σε 24 ώρες
                </p>
              </div>
            </div>
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

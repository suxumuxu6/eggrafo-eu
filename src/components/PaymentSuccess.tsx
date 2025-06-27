
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [payerId, setPayerId] = useState<string>('');

  useEffect(() => {
    const urlPaymentId = searchParams.get('paymentId');
    const urlPayerId = searchParams.get('PayerID');
    const urlToken = searchParams.get('token');
    
    console.log('PaymentSuccess URL params:', { urlPaymentId, urlPayerId, urlToken });

    if (urlPaymentId && urlPayerId) {
      setPaymentId(urlPaymentId);
      setPayerId(urlPayerId);
      verifyPayPalPayment(urlPaymentId, urlPayerId);
    } else {
      // Fallback: Check localStorage for pending donation
      checkPendingDonation();
    }
  }, [searchParams]);

  const verifyPayPalPayment = async (paymentId: string, payerId: string) => {
    try {
      console.log('Verifying PayPal payment:', { paymentId, payerId });
      
      // Get donation ID from localStorage
      const pending = localStorage.getItem('pendingDonation');
      let donationId = null;
      
      if (pending) {
        const donationData = JSON.parse(pending);
        donationId = donationData.donationId;
        setUserEmail(donationData.email || '');
      }

      if (!donationId) {
        throw new Error('Δεν βρέθηκε το αναγνωριστικό της δωρεάς');
      }

      const { data, error } = await supabase.functions.invoke('verify-paypal-payment', {
        body: { 
          paymentId, 
          payerId, 
          donationId 
        }
      });

      console.log('PayPal verification response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Σφάλμα επαλήθευσης PayPal');
      }

      if (data?.success) {
        setVerified(true);
        toast.success('Η πληρωμή επιβεβαιώθηκε επιτυχώς!');
        
        // Clear pending donation
        localStorage.removeItem('pendingDonation');
        
        // Send download email automatically
        await sendDownloadEmail(donationId);
      } else {
        throw new Error(data?.error || 'Αποτυχία επαλήθευσης πληρωμής');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Αποτυχία επαλήθευσης πληρωμής');
    } finally {
      setVerifying(false);
    }
  };

  const checkPendingDonation = () => {
    try {
      const pending = localStorage.getItem('pendingDonation');
      if (pending) {
        const donationData = JSON.parse(pending);
        console.log('Found pending donation:', donationData);
        setUserEmail(donationData.email || '');
        
        // Poll for payment completion
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

  const pollForPaymentCompletion = async (donationId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 60 seconds
    
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
          toast.success('Η πληρωμή επιβεβαιώθηκε επιτυχώς!');
          
          // Clear pending donation
          localStorage.removeItem('pendingDonation');
          setVerifying(false);
          
          // Send download email
          await sendDownloadEmail(donationId);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
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

  const sendDownloadEmail = async (donationId: string) => {
    try {
      const { data: donation, error } = await supabase
        .from('donations')
        .select(`
          *,
          documents (
            title,
            file_url
          )
        `)
        .eq('id', donationId)
        .single();

      if (error || !donation) {
        console.error('Error fetching donation for email:', error);
        return;
      }

      const downloadUrl = `https://eggrafo.work/download?token=${donation.link_token}`;
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Σας ευχαριστούμε για τη δωρεά σας των ${donation.amount}€!

Μπορείτε να κατεβάσετε το έγγραφο από τον παρακάτω σύνδεσμο:
${downloadUrl}

ΠΡΟΣΟΧΗ: Ο σύνδεσμος λήγει σε 24 ώρες από την πληρωμή.

PayPal Transaction ID: ${donation.paypal_transaction_id}

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      const { error: emailError } = await supabase.functions.invoke('send-download-email', {
        body: {
          to: donation.email,
          subject: 'Ευχαριστούμε για τη δωρεά σας - Download Link',
          text: emailBody,
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast.error('Αποτυχία αποστολής email');
      } else {
        toast.success(`Email στάλθηκε επιτυχώς στο ${donation.email}`);
      }
    } catch (error: any) {
      console.error('Error in sendDownloadEmail:', error);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleManualVerification = () => {
    if (paymentId) {
      verifyPayPalPayment(paymentId, payerId);
    } else {
      toast.error('Δεν βρέθηκε αναγνωριστικό πληρωμής');
    }
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
              Αυτό μπορεί να διαρκέσει μέχρι 60 δευτερόλεπτα.
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
              Πρόβλημα με την Επαλήθευση
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-yellow-800 text-sm mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Τι μπορείτε να κάνετε:</span>
              </div>
              <p className="text-xs text-yellow-700">
                1. Ελέγξτε το email σας για επιβεβαίωση PayPal<br/>
                2. Δοκιμάστε την χειροκίνητη επαλήθευση<br/>
                3. Επικοινωνήστε με την υποστήριξη
              </p>
            </div>
            
            <div className="space-y-2">
              {paymentId && (
                <Button 
                  onClick={handleManualVerification} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Δοκιμάστε Ξανά την Επαλήθευση
                </Button>
              )}
              <Button onClick={handleReturnHome} variant="outline" className="w-full">
                Επιστροφή στα Έγγραφα
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;


import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DonationData {
  id: string;
  status: string;
  amount: number;
  email: string;
  document_id: string | null;
  expires_at: string;
}

interface DocumentData {
  id: string;
  title: string;
  file_url: string;
}

const DocumentDownload: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Μη έγκυρος σύνδεσμος. Δεν βρέθηκε token.');
      setLoading(false);
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-donation-link', {
        body: { token }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Αποτυχία επαλήθευσης');
      }

      setDonation(data.donation);
      setDocument(data.document);
      setLoading(false);

      // Start countdown timer
      if (data.donation.expires_at) {
        startCountdown(data.donation.expires_at);
      }

    } catch (err: any) {
      console.error('Token verification error:', err);
      setError(err.message || 'Σφάλμα επαλήθευσης συνδέσμου');
      setLoading(false);
    }
  };

  const startCountdown = (expiresAt: string) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours}ώ ${minutes}λ ${seconds}δ`);
      } else {
        setTimeLeft('Έληξε');
        setError('Ο σύνδεσμος έχει λήξει');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  const handleDownload = () => {
    if (document?.file_url) {
      window.open(document.file_url, '_blank');
      toast.success('Το αρχείο ανοίγει σε νέα καρτέλα');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Επαλήθευση Συνδέσμου
          </h2>
          <p className="text-gray-600">
            Παρακαλώ περιμένετε...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Σφάλμα Πρόσβασης
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button onClick={() => navigate('/')} className="w-full bg-kb-blue hover:bg-kb-blue/90">
            Επιστροφή στην Αρχική
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Πρόσβαση Επιβεβαιωμένη!
        </h2>
        
        {donation && (
          <div className="mb-6 space-y-3">
            <p className="text-sm text-gray-600">
              Ευχαριστούμε για τη δωρεά των <span className="font-semibold">{donation.amount}€</span>
            </p>
            
            {timeLeft && (
              <div className="flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <Clock className="h-4 w-4" />
                <span>Ο σύνδεσμος λήγει σε: {timeLeft}</span>
              </div>
            )}
          </div>
        )}

        {document ? (
          <div className="space-y-4">
            <div className="text-left bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-kb-blue mb-1">{document.title}</h3>
              <p className="text-sm text-gray-600">Κάντε κλικ παρακάτω για λήψη</p>
            </div>
            
            <Button 
              onClick={handleDownload} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Λήψη Εγγράφου
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Η δωρεά σας επιβεβαιώθηκε επιτυχώς! Δεν υπάρχει συγκεκριμένο έγγραφο συνδεδεμένο με αυτή τη δωρεά.
            </p>
          </div>
        )}

        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="w-full mt-4"
        >
          Επιστροφή στα Έγγραφα
        </Button>
      </div>
    </div>
  );
};

export default DocumentDownload;

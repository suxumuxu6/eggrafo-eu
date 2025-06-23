
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Download, Clock, AlertTriangle, Shield } from 'lucide-react';
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
  const { isAdmin, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Μη έγκυρος σύνδεσμος. Δεν βρέθηκε token.');
      setLoading(false);
      return;
    }

    // Check if user is admin - if so, handle differently
    if (isAuthenticated && isAdmin) {
      handleAdminDownload(token);
    } else {
      verifyToken(token);
    }
  }, [searchParams, isAdmin, isAuthenticated]);

  const handleAdminDownload = async (token: string) => {
    try {
      console.log('Admin download - bypassing donation verification');
      
      // For admin, directly look up the donation and document
      const { data: donationData, error: donationError } = await supabase
        .from("donations")
        .select(`
          id, status, amount, email, document_id, expires_at,
          documents:document_id (
            id, title, file_url
          )
        `)
        .eq("link_token", token)
        .maybeSingle();

      if (donationError || !donationData) {
        console.error('Admin: Donation lookup error:', donationError);
        setError('Δεν βρέθηκε η δωρεά');
        setLoading(false);
        return;
      }

      console.log('Admin: Found donation data:', donationData);
      
      setDonation(donationData);
      if (donationData.documents) {
        setDocument(donationData.documents);
      }
      setLoading(false);

    } catch (err: any) {
      console.error('Admin download error:', err);
      setError('Σφάλμα κατά την ανάκτηση των δεδομένων');
      setLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      console.log('Regular user - verifying token:', token);
      
      const { data, error } = await supabase.functions.invoke('verify-donation-link', {
        body: { token }
      });

      console.log('Verification response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Σφάλμα επαλήθευσης συνδέσμου');
      }

      if (!data.success) {
        if (data.error === "Download link has expired") {
          setIsExpired(true);
          setError('Ο σύνδεσμος λήψης έχει λήξει. Παρακαλώ επικοινωνήστε με την υποστήριξη.');
        } else {
          setError(data.error || 'Αποτυχία επαλήθευσης');
        }
        setLoading(false);
        return;
      }

      setDonation(data.donation);
      setDocument(data.document);
      setLoading(false);

      if (data.donation.expires_at && !isExpired) {
        startCountdown(data.donation.expires_at);
      }

    } catch (err: any) {
      console.error('Token verification error:', err);
      
      if (err.message && err.message.includes('InvalidJWT')) {
        setError('Ο σύνδεσμος έχει λήξει ή δεν είναι έγκυρος. Παρακαλώ επικοινωνήστε με την υποστήριξη.');
        setIsExpired(true);
      } else {
        setError(err.message || 'Σφάλμα επαλήθευσης συνδέσμου');
      }
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
        setIsExpired(true);
        setError('Ο σύνδεσμος έχει λήξει');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  const handleDownload = () => {
    if (document?.file_url && (!isExpired || isAdmin)) {
      window.open(document.file_url, '_blank');
      toast.success('Το αρχείο ανοίγει σε νέα καρτέλα');
    } else if (isExpired && !isAdmin) {
      toast.error('Ο σύνδεσμος έχει λήξει');
    } else {
      toast.error('Δεν υπάρχει διαθέσιμο αρχείο');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isAdmin ? 'Φόρτωση Αρχείου' : 'Επαλήθευση Συνδέσμου'}
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
          {isExpired ? (
            <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          ) : (
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isExpired ? 'Σύνδεσμος Έχει Λήξει' : 'Σφάλμα Πρόσβασης'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          {isExpired && !isAdmin && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Για νέο σύνδεσμο λήψης, παρακαλώ επικοινωνήστε μαζί μας στο support@eggrafo.work
              </p>
            </div>
          )}
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
          {isAdmin ? 'Πρόσβαση Διαχειριστή' : 'Πρόσβαση Επιβεβαιωμένη!'}
        </h2>
        
        {isAdmin && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded mb-4">
            <Shield className="h-4 w-4" />
            <span>Έχετε πρόσβαση ως διαχειριστής</span>
          </div>
        )}
        
        {donation && !isAdmin && (
          <div className="mb-6 space-y-3">
            <p className="text-sm text-gray-600">
              Ευχαριστούμε για τη δωρεά των <span className="font-semibold">{donation.amount}€</span>
            </p>
            
            {timeLeft && !isExpired && (
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
              <p className="text-sm text-gray-600">
                {isExpired && !isAdmin ? 'Ο σύνδεσμος έχει λήξει' : 'Κάντε κλικ παρακάτω για λήψη'}
              </p>
            </div>
            
            <Button 
              onClick={handleDownload} 
              disabled={isExpired && !isAdmin}
              className={`w-full ${isExpired && !isAdmin ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExpired && !isAdmin ? 'Σύνδεσμος Έληξε' : 'Λήψη Εγγράφου'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              {isAdmin ? 'Δεν υπάρχει έγγραφο συνδεδεμένο με αυτό το token.' : 'Η δωρεά σας επιβεβαιώθηκε επιτυχώς! Δεν υπάρχει συγκεκριμένο έγγραφο συνδεδεμένο με αυτή τη δωρεά.'}
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

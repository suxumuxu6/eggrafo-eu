
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DonationRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationRecoveryModal: React.FC<DonationRecoveryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [paypalId, setPaypalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);

  const searchDonations = async () => {
    if (!email.trim() && !paypalId.trim()) {
      toast.error('Παρακαλώ εισάγετε email ή PayPal transaction ID');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('donations')
        .select(`
          *,
          documents (
            title,
            file_url
          )
        `);

      if (email.trim()) {
        query = query.eq('email', email.trim());
      }
      if (paypalId.trim()) {
        query = query.eq('paypal_transaction_id', paypalId.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDonations(data || []);
      
      if (!data || data.length === 0) {
        toast.error('Δεν βρέθηκαν δωρεές με αυτά τα στοιχεία');
      } else {
        toast.success(`Βρέθηκαν ${data.length} δωρεές`);
      }
    } catch (error: any) {
      console.error('Error searching donations:', error);
      toast.error(`Σφάλμα αναζήτησης: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendDownloadEmail = async (donation: any) => {
    try {
      const downloadUrl = `https://eggrafo.work/download?token=${donation.link_token}`;
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Εδώ είναι το download link που ζητήσατε για τη δωρεά σας των ${donation.amount}€:

${downloadUrl}

ΠΡΟΣΟΧΗ: Ο σύνδεσμος λήγει σε 24 ώρες από την πληρωμή.

PayPal Transaction ID: ${donation.paypal_transaction_id}

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      const { error } = await supabase.functions.invoke('send-download-email', {
        body: {
          to: donation.email,
          subject: 'Ανάκτηση Download Link - Δωρεά eggrafo.work',
          text: emailBody,
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Email στάλθηκε επιτυχώς στο ${donation.email}`);
    } catch (error: any) {
      console.error('Error sending recovery email:', error);
      toast.error(`Αποτυχία αποστολής email: ${error.message}`);
    }
  };

  const copyDownloadLink = (donation: any) => {
    const downloadUrl = `https://eggrafo.work/download?token=${donation.link_token}`;
    navigator.clipboard.writeText(downloadUrl);
    toast.success('Ο σύνδεσμος αντιγράφηκε στο clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Ανάκτηση Download Link
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Εισάγετε το email της δωρεάς"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PayPal Transaction ID</label>
              <Input
                value={paypalId}
                onChange={(e) => setPaypalId(e.target.value)}
                placeholder="Εισάγετε το PayPal ID"
              />
            </div>
          </div>

          <Button onClick={searchDonations} disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Αναζήτηση...' : 'Αναζήτηση Δωρεών'}
          </Button>

          {donations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Βρέθηκαν Δωρεές:</h3>
              {donations.map((donation) => (
                <div key={donation.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{donation.amount}€ - {donation.status}</p>
                      <p className="text-sm text-gray-600">{donation.email}</p>
                      {donation.documents?.title && (
                        <p className="text-sm text-blue-600">{donation.documents.title}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        PayPal ID: {donation.paypal_transaction_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Δημιουργήθηκε: {new Date(donation.created_at).toLocaleString('el-GR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Λήγει: {new Date(donation.expires_at).toLocaleString('el-GR')}
                      </p>
                    </div>
                    
                    {donation.status === 'completed' && donation.link_token && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => resendDownloadEmail(donation)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Αποστολή Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyDownloadLink(donation)}
                        >
                          Αντιγραφή Link
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {donation.status !== 'completed' && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Η δωρεά δεν έχει ολοκληρωθεί ακόμα
                    </div>
                  )}
                  
                  {new Date(donation.expires_at) < new Date() && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Ο σύνδεσμος έχει λήξει
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationRecoveryModal;

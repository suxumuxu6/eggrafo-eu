
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Donation {
  id: string;
  amount: number;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
  paypal_transaction_id: string;
  document_id: string;
  link_token: string;
  documents?: {
    title: string;
    file_url: string;
  };
}

export const useDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sendingFile, setSendingFile] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedDonations, setSelectedDonations] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      console.log('Fetching donations...');
      
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          documents (
            title,
            file_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Donations fetched:', data?.length || 0);
      setDonations(data || []);
    } catch (error: any) {
      console.error('Error fetching donations:', error);
      toast.error('Αποτυχία φόρτωσης δωρεών');
    } finally {
      setLoading(false);
    }
  };

  const deleteDonation = async (donation: Donation) => {
    if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τη δωρεά των ${donation.amount}€ από ${donation.email}?`)) {
      return;
    }

    try {
      setDeleting(donation.id);
      
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', donation.id);

      if (error) {
        throw error;
      }

      toast.success('Η δωρεά διαγράφηκε επιτυχώς');
      await fetchDonations();
    } catch (error: any) {
      console.error('Error deleting donation:', error);
      toast.error(`Αποτυχία διαγραφής δωρεάς: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const bulkDeleteDonations = async () => {
    if (selectedDonations.size === 0) {
      toast.error('Παρακαλώ επιλέξτε δωρεές για διαγραφή');
      return;
    }

    if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε ${selectedDonations.size} δωρεές;`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      
      const { error } = await supabase
        .from('donations')
        .delete()
        .in('id', Array.from(selectedDonations));

      if (error) {
        throw error;
      }

      toast.success(`${selectedDonations.size} δωρεές διαγράφηκαν επιτυχώς`);
      setSelectedDonations(new Set());
      await fetchDonations();
    } catch (error: any) {
      console.error('Error bulk deleting donations:', error);
      toast.error(`Αποτυχία διαγραφής δωρεών: ${error.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleDonationSelection = (donationId: string) => {
    const newSelected = new Set(selectedDonations);
    if (newSelected.has(donationId)) {
      newSelected.delete(donationId);
    } else {
      newSelected.add(donationId);
    }
    setSelectedDonations(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDonations.size === donations.length) {
      setSelectedDonations(new Set());
    } else {
      setSelectedDonations(new Set(donations.map(d => d.id)));
    }
  };

  const sendDownloadEmail = async (donation: Donation) => {
    try {
      setSendingEmail(donation.id);
      
      const downloadUrl = `https://eggrafo.work/download?token=${donation.link_token}`;
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Σας ευχαριστούμε για τη δωρεά σας των ${donation.amount}€!

Μπορείτε να κατεβάσετε το έγγραφο από τον παρακάτω σύνδεσμο:
${downloadUrl}

ΠΡΟΣΟΧΗ: Ο σύνδεσμος λήγει σε 24 ώρες από την πληρωμή.

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      const { data, error } = await supabase.functions.invoke('send-download-email', {
        body: {
          to: donation.email,
          subject: 'Ευχαριστούμε για τη δωρεά σας - Download Link',
          text: emailBody,
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Email στάλθηκε επιτυχώς στο ${donation.email}`);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`Αποτυχία αποστολής email: ${error.message}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const sendFileDirectly = async (donation: Donation) => {
    if (!donation.documents?.file_url) {
      toast.error('Δεν υπάρχει αρχείο για αποστολή');
      return;
    }

    try {
      setSendingFile(donation.id);
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Σας ευχαριστούμε για τη δωρεά σας των ${donation.amount}€!

Παρακάτω θα βρείτε το αρχείο που ζητήσατε:
${donation.documents.file_url}

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      const { data, error } = await supabase.functions.invoke('send-download-email', {
        body: {
          to: donation.email,
          subject: `Το αρχείο σας: ${donation.documents.title}`,
          text: emailBody,
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Αρχείο στάλθηκε επιτυχώς στο ${donation.email}`);
    } catch (error: any) {
      console.error('Error sending file:', error);
      toast.error(`Αποτυχία αποστολής αρχείου: ${error.message}`);
    } finally {
      setSendingFile(null);
    }
  };

  const sendPdfDirectly = async (donation: Donation) => {
    if (!donation.documents?.file_url) {
      toast.error('Δεν υπάρχει αρχείο PDF για αποστολή');
      return;
    }

    try {
      setSendingFile(donation.id);
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Σας ευχαριστούμε για τη δωρεά σας των ${donation.amount}€!

Παρακάτω θα βρείτε το αρχείο PDF που ζητήσατε:

📄 Τίτλος: ${donation.documents.title}
🔗 Σύνδεσμος: ${donation.documents.file_url}

Μπορείτε να κάνετε κλικ στον παραπάνω σύνδεσμο για να κατεβάσετε το αρχείο.

Εάν αντιμετωπίζετε οποιοδήποτε πρόβλημα με τη λήψη, παρακαλώ επικοινωνήστε μαζί μας.

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      const { data, error } = await supabase.functions.invoke('send-download-email', {
        body: {
          to: donation.email,
          subject: `Αρχείο PDF: ${donation.documents.title}`,
          text: emailBody,
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Αρχείο PDF στάλθηκε επιτυχώς στο ${donation.email}`);
    } catch (error: any) {
      console.error('Error sending PDF:', error);
      toast.error(`Αποτυχία αποστολής PDF: ${error.message}`);
    } finally {
      setSendingFile(null);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  return {
    donations,
    loading,
    sendingEmail,
    sendingFile,
    deleting,
    selectedDonations,
    bulkDeleting,
    fetchDonations,
    deleteDonation,
    bulkDeleteDonations,
    toggleDonationSelection,
    toggleSelectAll,
    sendDownloadEmail,
    sendFileDirectly,
    sendPdfDirectly
  };
};

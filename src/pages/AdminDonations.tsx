import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Mail, RefreshCw, Calendar, Euro, User, FileText, Trash2, Send, CheckSquare, Square, Download } from 'lucide-react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

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

const AdminDonations: React.FC = () => {
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
      
      // Create a more comprehensive email with the PDF link
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 text-xs">Ολοκληρώθηκε</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Εκκρεμεί</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Φόρτωση δωρεών...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Δωρεών</h1>
          <div className="flex gap-2">
            {selectedDonations.size > 0 && (
              <Button 
                onClick={bulkDeleteDonations}
                disabled={bulkDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {bulkDeleting ? 'Διαγραφή...' : `Διαγραφή (${selectedDonations.size})`}
              </Button>
            )}
            <Button onClick={fetchDonations} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Ανανέωση
            </Button>
          </div>
        </div>

        {donations.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Button
              onClick={toggleSelectAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {selectedDonations.size === donations.length ? 
                <CheckSquare className="h-4 w-4" /> : 
                <Square className="h-4 w-4" />
              }
              {selectedDonations.size === donations.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
            </Button>
            <span className="text-sm text-gray-600">
              {selectedDonations.size} από {donations.length} επιλεγμένα
            </span>
          </div>
        )}

        <div className="grid gap-3">
          {donations.map((donation) => (
            <Card key={donation.id} className="w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDonations.has(donation.id)}
                      onCheckedChange={() => toggleDonationSelection(donation.id)}
                    />
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Euro className="h-4 w-4 text-green-600" />
                      {donation.amount}€
                      {getStatusBadge(donation.status)}
                    </CardTitle>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(donation.created_at), 'dd/MM/yyyy HH:mm', { locale: el })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs truncate">{donation.email}</span>
                  </div>
                  
                  {donation.documents?.title && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-xs truncate">{donation.documents.title}</span>
                    </div>
                  )}
                  
                  {donation.paypal_transaction_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">PayPal ID:</span>
                      <span className="text-xs font-mono truncate">{donation.paypal_transaction_id}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className={`text-xs ${isExpired(donation.expires_at) ? 'text-red-600' : 'text-gray-600'}`}>
                      Λήγει: {format(new Date(donation.expires_at), 'dd/MM/yyyy HH:mm', { locale: el })}
                      {isExpired(donation.expires_at) && ' (Έληξε)'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {donation.status === 'completed' && (
                    <>
                      <Button
                        onClick={() => sendDownloadEmail(donation)}
                        disabled={sendingEmail === donation.id}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {sendingEmail === donation.id ? 'Αποστολή...' : 'Email Link'}
                      </Button>
                      
                      {donation.documents?.file_url && (
                        <>
                          <Button
                            onClick={() => sendFileDirectly(donation)}
                            disabled={sendingFile === donation.id}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {sendingFile === donation.id ? 'Αποστολή...' : 'Αποστολή Αρχείου'}
                          </Button>
                          
                          <Button
                            onClick={() => sendPdfDirectly(donation)}
                            disabled={sendingFile === donation.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-7"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {sendingFile === donation.id ? 'Αποστολή...' : 'Αποστολή PDF'}
                          </Button>
                        </>
                      )}
                      
                      {donation.link_token && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            const url = `https://eggrafo.work/download?token=${donation.link_token}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link αντιγράφηκε στο clipboard');
                          }}
                        >
                          Αντιγραφή Link
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    onClick={() => deleteDonation(donation)}
                    disabled={deleting === donation.id}
                    size="sm"
                    variant="destructive"
                    className="text-xs h-7 ml-auto"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {deleting === donation.id ? 'Διαγραφή...' : 'Διαγραφή'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {donations.length === 0 && (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-gray-500">Δεν βρέθηκαν δωρεές</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDonations;

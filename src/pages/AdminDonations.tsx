
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, RefreshCw, Calendar, Euro, User, FileText } from 'lucide-react';
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
  };
}

const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          documents (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDonations(data || []);
    } catch (error: any) {
      console.error('Error fetching donations:', error);
      toast.error('Αποτυχία φόρτωσης δωρεών');
    } finally {
      setLoading(false);
    }
  };

  const sendDownloadEmail = async (donation: Donation) => {
    try {
      setSendingEmail(donation.id);
      
      // Create download link with the link_token
      const downloadUrl = `https://eggrafo.work/download?token=${donation.link_token}`;
      
      const emailBody = `Αγαπητέ/ή χρήστη,

Σας ευχαριστούμε για τη δωρεά σας των ${donation.amount}€!

Μπορείτε να κατεβάσετε το έγγραφο από τον παρακάτω σύνδεσμο:
${downloadUrl}

ΠΡΟΣΟΧΗ: Ο σύνδεσμος λήγει σε 24 ώρες από την πληρωμή.

Με εκτίμηση,
Η ομάδα eggrafo.work`;

      // Send email using Resend edge function
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Ολοκληρώθηκε</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Εκκρεμεί</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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
      <div className="min-h-screen bg-gray-50 p-6">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Δωρεών</h1>
          <Button onClick={fetchDonations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Ανανέωση
          </Button>
        </div>

        <div className="grid gap-6">
          {donations.map((donation) => (
            <Card key={donation.id} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-green-600" />
                    {donation.amount}€
                    {getStatusBadge(donation.status)}
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {format(new Date(donation.created_at), 'dd/MM/yyyy HH:mm', { locale: el })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{donation.email}</span>
                  </div>
                  
                  {donation.documents?.title && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{donation.documents.title}</span>
                    </div>
                  )}
                  
                  {donation.paypal_transaction_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">PayPal ID:</span>
                      <span className="text-xs font-mono">{donation.paypal_transaction_id}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className={`text-sm ${isExpired(donation.expires_at) ? 'text-red-600' : 'text-gray-600'}`}>
                      Λήγει: {format(new Date(donation.expires_at), 'dd/MM/yyyy HH:mm', { locale: el })}
                      {isExpired(donation.expires_at) && ' (Έληξε)'}
                    </span>
                  </div>
                </div>

                {donation.status === 'completed' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => sendDownloadEmail(donation)}
                      disabled={sendingEmail === donation.id}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendingEmail === donation.id ? 'Αποστολή...' : 'Αποστολή Email'}
                    </Button>
                    
                    {donation.link_token && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `https://eggrafo.work/download?token=${donation.link_token}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Link αντιγράφηκε στο clipboard');
                        }}
                      >
                        Αντιγραφή Link
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {donations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Δεν βρέθηκαν δωρεές</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDonations;

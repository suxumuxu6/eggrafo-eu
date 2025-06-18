
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Euro, User, FileText, Trash2, Send, Download, Mail } from 'lucide-react';
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

interface DonationCardProps {
  donation: Donation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (donation: Donation) => void;
  onSendEmail: (donation: Donation) => void;
  onSendFile: (donation: Donation) => void;
  onSendPdf: (donation: Donation) => void;
  sendingEmail: string | null;
  sendingFile: string | null;
  deleting: string | null;
}

const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  isSelected,
  onSelect,
  onDelete,
  onSendEmail,
  onSendFile,
  onSendPdf,
  sendingEmail,
  sendingFile,
  deleting
}) => {
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

  const copyLink = () => {
    const url = `https://eggrafo.work/download?token=${donation.link_token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Card key={donation.id} className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(donation.id)}
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
                onClick={() => onSendEmail(donation)}
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
                    onClick={() => onSendFile(donation)}
                    disabled={sendingFile === donation.id}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {sendingFile === donation.id ? 'Αποστολή...' : 'Αποστολή Αρχείου'}
                  </Button>
                  
                  <Button
                    onClick={() => onSendPdf(donation)}
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
                  onClick={copyLink}
                >
                  Αντιγραφή Link
                </Button>
              )}
            </>
          )}
          
          <Button
            onClick={() => onDelete(donation)}
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
  );
};

export default DonationCard;

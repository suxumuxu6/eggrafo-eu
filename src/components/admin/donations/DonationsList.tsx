
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DonationCard from './DonationCard';

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

interface DonationsListProps {
  donations: Donation[];
  selectedDonations: Set<string>;
  onToggleSelection: (id: string) => void;
  onDelete: (donation: Donation) => void;
  onSendEmail: (donation: Donation) => void;
  onSendFile: (donation: Donation) => void;
  onSendPdf: (donation: Donation) => void;
  sendingEmail: string | null;
  sendingFile: string | null;
  deleting: string | null;
}

const DonationsList: React.FC<DonationsListProps> = ({
  donations,
  selectedDonations,
  onToggleSelection,
  onDelete,
  onSendEmail,
  onSendFile,
  onSendPdf,
  sendingEmail,
  sendingFile,
  deleting
}) => {
  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-gray-500">Δεν βρέθηκαν δωρεές</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {donations.map((donation) => (
        <DonationCard
          key={donation.id}
          donation={donation}
          isSelected={selectedDonations.has(donation.id)}
          onSelect={onToggleSelection}
          onDelete={onDelete}
          onSendEmail={onSendEmail}
          onSendFile={onSendFile}
          onSendPdf={onSendPdf}
          sendingEmail={sendingEmail}
          sendingFile={sendingFile}
          deleting={deleting}
        />
      ))}
    </div>
  );
};

export default DonationsList;


import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDonations } from '@/hooks/useDonations';
import DonationsHeader from '@/components/admin/donations/DonationsHeader';
import DonationsList from '@/components/admin/donations/DonationsList';

const AdminDonations: React.FC = () => {
  const {
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
  } = useDonations();

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
        <DonationsHeader
          totalDonations={donations.length}
          selectedCount={selectedDonations.size}
          onRefresh={fetchDonations}
          onBulkDelete={bulkDeleteDonations}
          onToggleSelectAll={toggleSelectAll}
          loading={loading}
          bulkDeleting={bulkDeleting}
        />

        <DonationsList
          donations={donations}
          selectedDonations={selectedDonations}
          onToggleSelection={toggleDonationSelection}
          onDelete={deleteDonation}
          onSendEmail={sendDownloadEmail}
          onSendFile={sendFileDirectly}
          onSendPdf={sendPdfDirectly}
          sendingEmail={sendingEmail}
          sendingFile={sendingFile}
          deleting={deleting}
        />
      </div>
    </div>
  );
};

export default AdminDonations;

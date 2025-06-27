
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Trash2, Search } from 'lucide-react';
import DonationRecoveryModal from './DonationRecoveryModal';

interface DonationsHeaderProps {
  totalDonations: number;
  selectedCount: number;
  onRefresh: () => void;
  onBulkDelete: () => void;
  onToggleSelectAll: () => void;
  loading: boolean;
  bulkDeleting: boolean;
}

const DonationsHeader: React.FC<DonationsHeaderProps> = ({
  totalDonations,
  selectedCount,
  onRefresh,
  onBulkDelete,
  onToggleSelectAll,
  loading,
  bulkDeleting
}) => {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  return (
    <>
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Δωρεών</h1>
            <p className="text-gray-600">
              Σύνολο: {totalDonations} δωρεές
              {selectedCount > 0 && ` | Επιλεγμένες: ${selectedCount}`}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowRecoveryModal(true)}
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Search className="h-4 w-4 mr-2" />
              Ανάκτηση Link
            </Button>
            
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Ανανέωση
            </Button>
            
            {totalDonations > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === totalDonations}
                  onCheckedChange={onToggleSelectAll}
                />
                <span className="text-sm">Επιλογή όλων</span>
              </div>
            )}
            
            {selectedCount > 0 && (
              <Button
                onClick={onBulkDelete}
                disabled={bulkDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {bulkDeleting ? 'Διαγραφή...' : `Διαγραφή (${selectedCount})`}
              </Button>
            )}
          </div>
        </div>
      </div>

      <DonationRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
      />
    </>
  );
};

export default DonationsHeader;

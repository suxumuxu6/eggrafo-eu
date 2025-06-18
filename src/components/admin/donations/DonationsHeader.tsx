
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react';

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
  const allSelected = selectedCount === totalDonations && totalDonations > 0;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Δωρεών</h1>
        <div className="flex gap-2">
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
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Ανανέωση
          </Button>
        </div>
      </div>

      {totalDonations > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            onClick={onToggleSelectAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {allSelected ? 
              <CheckSquare className="h-4 w-4" /> : 
              <Square className="h-4 w-4" />
            }
            {allSelected ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
          </Button>
          <span className="text-sm text-gray-600">
            {selectedCount} από {totalDonations} επιλεγμένα
          </span>
        </div>
      )}
    </>
  );
};

export default DonationsHeader;

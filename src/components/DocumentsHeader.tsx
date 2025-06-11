
import React from 'react';
import SearchBar from './SearchBar';

interface DocumentsHeaderProps {
  onSearch: (query: string) => void;
}

const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({ onSearch }) => {
  return (
    <div className="mb-12 text-center">
      <h1 className="text-3xl font-bold mb-4 text-kb-darkgray">ΕΒΕΑ ΟΕ/ΕΕ PORTAL</h1>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Μέσα στο site μπορείτε βρείτε γνωμοδοτήσεις των νομικών συμβούλων , manuals και άλλα έγγραφα μέσα απο τις κατηγορίες καθώς και την αναζήτηση.
      </p>
      <SearchBar onSearch={onSearch} />
    </div>
  );
};

export default DocumentsHeader;

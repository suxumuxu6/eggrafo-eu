
import React from 'react';
import SearchBar from './SearchBar';

interface DocumentsHeaderProps {
  onSearch: (query: string) => void;
  searchQuery?: string;
}

const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  onSearch,
  searchQuery
}) => {
  return (
    <div className="mb-12 text-center">
      {/* Header image */}
      <img
        src="/lovable-uploads/b1b6e120-07f2-44d4-badf-84273ddb82f8.png"
        alt="Εggrafo Header"
        className="w-full h-auto object-contain rounded-xl mb-8 shadow"
        style={{ maxHeight: '500px', objectPosition: 'center' }}
      />
      {/* Removed: <h1>Eggrafo.eu</h1> */}
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Μέσα στο site μπορείτε βρείτε παραδείγματα εγγράφων για τροποποιήσεις και άλλες αιτήσεις για ΟΕ-ΕΕ στο ΓΕΜΗ. Στηρίξτε την προσπάθειά μας.
      </p>
      <SearchBar onSearch={onSearch} searchQuery={searchQuery} />
    </div>
  );
};

export default DocumentsHeader;

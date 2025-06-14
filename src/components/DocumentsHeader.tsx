
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
      {/* Header image replaced with uploaded image */}
      <img
        src="/lovable-uploads/75c28a96-9985-490d-a769-b17a111dcf10.png"
        alt="Εggrafo Header"
        className="w-full h-auto object-contain rounded-xl mb-8 shadow"
        style={{ maxHeight: '500px', objectPosition: 'center' }}
      />
      {/* Removed: <h1>Eggrafo.eu</h1> */}
      <p
        className="max-w-2xl mx-auto mb-8 font-medium"
        style={{ fontSize: "1.25rem", color: "#111111" }}
      >
        Μέσα στο site μπορείτε βρείτε παραδείγματα εγγράφων για τροποποιήσεις και άλλες αιτήσεις για ΟΕ-ΕΕ στο ΓΕΜΗ. Στηρίξτε την προσπάθειά μας.
      </p>
      {/* Added more space above and below the search bar */}
      <div className="my-14 flex justify-center items-center">
        <SearchBar onSearch={onSearch} searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default DocumentsHeader;


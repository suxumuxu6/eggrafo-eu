
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
    <header className="mb-12 text-center">
      {/* Header image with SEO optimized alt text */}
      <img 
        src="/lovable-uploads/75c28a96-9985-490d-a769-b17a111dcf10.png" 
        alt="Eggrafo.eu - Παραδείγματα εγγράφων ΓΕΜΗ και νόμοι εταιρειών για δωρεάν λήψη" 
        className="w-full h-auto object-contain rounded-xl mb-8 shadow" 
        style={{
          maxHeight: '500px',
          objectPosition: 'center'
        }}
        loading="eager"
        fetchPriority="high"
      />
      
      {/* Main heading for SEO */}
      <h1 className="sr-only">Παραδείγματα εγγράφων ΓΕΜΗ - Δωρεάν λήψη νόμων εταιρειών</h1>
      
      {/* Descriptive content with SEO keywords */}
      <div className="max-w-3xl mx-auto mb-8">
        <p 
          style={{
            fontSize: "1.25rem",
            color: "#111111"
          }} 
          className="text-left text-xl px-0 font-medium"
        >
          Μέσα στο site μπορείτε βρείτε παραδείγματα εγγράφων και υποδείγματα για τροποποιήσεις, μετατροπές εταιρειών και άλλα για αιτήσεις στο ΓΕΜΗ. Επίσης μπορείτε να στείλετε τι αίτημα μας για συγκεκριμένο υπόδειγμα στο Chat. Στηρίξτε την προσπάθειά μας.
        </p>
      </div>
      
      {/* Search section with ARIA labels */}
      <section className="my-14 flex justify-center items-center" aria-label="Αναζήτηση εγγράφων">
        <SearchBar onSearch={onSearch} searchQuery={searchQuery} />
      </section>
    </header>
  );
};

export default DocumentsHeader;

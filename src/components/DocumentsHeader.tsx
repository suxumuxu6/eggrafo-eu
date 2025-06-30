
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
  return <header className="mb-12 text-center">
      {/* Header image with SEO optimized alt text */}
      <img src="/lovable-uploads/75c28a96-9985-490d-a769-b17a111dcf10.png" alt="Eggrafo.eu - Παραδείγματα εγγράφων ΓΕΜΗ και νόμοι εταιρειών για δωρεάν λήψη" className="w-full h-auto object-contain rounded-xl mb-8 shadow" style={{
      maxHeight: '500px',
      objectPosition: 'center'
    }} loading="eager" fetchPriority="high" />
      
      {/* Main heading for SEO */}
      <h1 className="sr-only">Παραδείγματα εγγράφων ΓΕΜΗ - Δωρεάν λήψη νόμων εταιρειών</h1>
      
      {/* Descriptive content with SEO keywords */}
      <div className="w-full mx-auto mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 shadow-sm">
        <p style={{
        fontSize: "1.25rem",
        color: "#111111"
      }} className="font-medium text-justify text-xl mx-0 py-[34px] px-[4px]">
          Μέσα στο site μπορείτε βρείτε και να κατεβάσετε παραδείγματα εγγράφων και υποδείγματα για το ΓΕΜΗ για τροποποιήσεις, μετατροπές εταιρειών, αλλαγή έδρας , λύσεις και άλλα για αιτήσεις στο ΓΕΜΗ.
          <br />
          Επίσης αν θέλετε κάποιο άλλο παράδειγμα μπορείτε να στείλετε το αίτημά σας για συγκεκριμένο υπόδειγμα στο Chat.
          <br />
          Στηρίξτε την προσπάθειά μας.
        </p>
      </div>
      
      {/* Search section with ARIA labels */}
      <section className="my-14 flex justify-center items-center" aria-label="Αναζήτηση εγγράφων">
        <SearchBar onSearch={onSearch} searchQuery={searchQuery} />
      </section>
    </header>;
};
export default DocumentsHeader;

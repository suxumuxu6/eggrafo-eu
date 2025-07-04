
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
          Υπόδειγμα Εγγράφου για Αιτήσεις στο ΓΕΜΗ – Έτοιμα Παραδείγματα
          <br />
          Ψάχνετε υπόδειγμα εγγράφου για αιτήσεις στο ΓΕΜΗ; Στον ιστότοπό μας, θα βρείτε έτοιμα παραδείγματα εγγράφων για:
          <br />
          <br />
          Τροποποιήσεις εταιρειών, Μετατροπές νομικών μορφών,  Αλλαγές έδρας,
          <br />
          Λύσεις κ.α.
          <br />
          <br />
          Χρειάζεστε συγκεκριμένο υπόδειγμα;
          <br />
          Αν δεν βρίσκετε το επιθυμητό παράδειγμα, στείλτε μας το αίτημά σας μέσω του Chat και θα σας βοηθήσουμε άμεσα!
        </p>
      </div>
      
      {/* Search section with ARIA labels */}
      <section className="my-14 flex justify-center items-center" aria-label="Αναζήτηση εγγράφων">
        <SearchBar onSearch={onSearch} searchQuery={searchQuery} />
      </section>
    </header>;
};
export default DocumentsHeader;

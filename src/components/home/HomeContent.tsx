
import React from 'react';
import DocumentsHeader from '../DocumentsHeader';
import DocumentsSection from '../DocumentsSection';
import FeaturedDocumentsSection from '../FeaturedDocumentsSection';
import LiveChatWidget from '../LiveChatWidget';
import SEOHead from '../SEOHead';
import { Document } from '../../utils/searchUtils';

interface HomeContentProps {
  filteredDocuments: Document[];
  allDocuments: Document[];
  isAdmin: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}

const HomeContent: React.FC<HomeContentProps> = ({
  filteredDocuments,
  allDocuments,
  isAdmin,
  searchQuery,
  onSearch,
  onViewDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  // Dynamic SEO based on search query
  const getSEOData = () => {
    if (searchQuery) {
      return {
        title: `Αναζήτηση: ${searchQuery} | Παραδείγματα εγγράφων ΓΕΜΗ | Eggrafo.eu`,
        description: `Αποτελέσματα αναζήτησης για "${searchQuery}" - Βρείτε παραδείγματα εγγράφων ΓΕΜΗ, τροποποιήσεις εταιρειών και νόμους επιχειρήσεων.`,
        keywords: `${searchQuery}, ΓΕΜΗ έγγραφα, παραδείγματα εγγράφων, τροποποιήσεις εταιρειών, αναζήτηση εγγράφων, Υπόδειγμα αναβίωσης εταιρείας, Υπόδειγμα μετατροπής εταιρείας, Πρακτικό αλλαγής Έδρας στον ίδιο Δήμο`,
      };
    }
    
    return {
      title: "Παραδείγματα εγγράφων ΓΕΜΗ | Δωρεάν λήψη νόμων εταιρειών | Eggrafo.eu",
      description: "Βρείτε παραδείγματα εγγράφων για το ΓΕΜΗ, τροποποιήσεις εταιρειών και αιτήσεις. Δωρεάν λήψη νόμων εταιρειών στην Ελλάδα. Πρότυπα καταστατικά και επιχειρηματικά έγγραφα.",
      keywords: "ΓΕΜΗ, έγγραφα ΓΕΜΗ, παραδείγματα εγγράφων, τροποποιήσεις εταιρειών, νόμοι εταιρειών, αιτήσεις ΓΕΜΗ, επιχειρηματικά έγγραφα, πρότυπα καταστατικά, ΓΕΜΗ Ελλάδα, επιχειρήσεις Αθήνα, Υπόδειγμα αναβίωσης εταιρείας, Υπόδειγμα μετατροπής εταιρείας, Πρακτικό αλλαγής Έδρας στον ίδιο Δήμο",
    };
  };

  const seoData = getSEOData();

  // Structured data for the homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": seoData.title,
    "description": seoData.description,
    "url": "https://eggrafo.eu/",
    "inLanguage": "el-GR",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Eggrafo.eu",
      "url": "https://eggrafo.eu"
    },
    "about": {
      "@type": "Thing",
      "name": "ΓΕΜΗ έγγραφα",
      "description": "Παραδείγματα εγγράφων και νόμοι εταιρειών για το ΓΕΜΗ"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Αρχική",
        "item": "https://eggrafo.eu/"
      }]
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl="https://eggrafo.eu/"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-blue-50 flex flex-col">
        <main className="container mx-auto px-4 py-8 flex-1" role="main">
          <DocumentsHeader onSearch={onSearch} searchQuery={searchQuery} />
          
          <section aria-label="Έγγραφα προς λήψη">
            <DocumentsSection
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin}
              onViewDocument={onViewDocument}
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
            />
          </section>
          
          <section aria-label="Νόμοι εταιρειών">
            <FeaturedDocumentsSection documents={allDocuments} />
          </section>
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-4" role="contentinfo">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-500">
              © Eggrafo.eu 2025 - Παραδείγματα εγγράφων ΓΕΜΗ και νόμοι εταιρειών
            </p>
            <nav className="mt-2" aria-label="Footer navigation">
              <ul className="flex justify-center space-x-4 text-xs text-gray-400">
                <li><a href="/support" className="hover:text-gray-600">Υποστήριξη</a></li>
                <li><span>|</span></li>
                <li><span>Δωρεάν έγγραφα επιχειρήσεων</span></li>
              </ul>
            </nav>
          </div>
        </footer>
        
        <LiveChatWidget />
      </div>
    </>
  );
};

export default HomeContent;

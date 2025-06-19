
import React from 'react';
import DocumentsHeader from '../DocumentsHeader';
import DocumentsSection from '../DocumentsSection';
import FeaturedDocumentsSection from '../FeaturedDocumentsSection';
import LiveChatWidget from '../LiveChatWidget';
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
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <DocumentsHeader onSearch={onSearch} searchQuery={searchQuery} />
        <DocumentsSection
          filteredDocuments={filteredDocuments}
          isAdmin={isAdmin}
          onViewDocument={onViewDocument}
          onEditDocument={onEditDocument}
          onDeleteDocument={onDeleteDocument}
        />
        <FeaturedDocumentsSection documents={allDocuments} />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© Eggrafo.eu 2025</p>
        </div>
      </footer>
      
      <LiveChatWidget />
    </div>
  );
};

export default HomeContent;

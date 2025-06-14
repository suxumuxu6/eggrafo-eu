
import React from 'react';
import DocumentsGrid from './DocumentsGrid';
import { Document } from '../utils/searchUtils';

interface DocumentsSectionProps {
  filteredDocuments: Document[];
  isAdmin: boolean;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  filteredDocuments,
  isAdmin,
  onViewDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  return (
    <div className="mb-8">
      {/* Styled header to match "Νόμοι Εταιρειών" */}
      <div className="w-full border-2 border-kb-blue bg-kb-blue rounded-xl shadow-sm animate-fade-in mb-6">
        <h2 className="text-2xl font-semibold text-white text-center py-4 px-2 m-0">
          Παραδείγματα Εγγράφων για λήψη
        </h2>
      </div>
      <DocumentsGrid
        documents={filteredDocuments}
        allDocuments={filteredDocuments}
        isAdmin={isAdmin}
        onViewDocument={onViewDocument}
        onEditDocument={onEditDocument}
        onDeleteDocument={onDeleteDocument}
      />
    </div>
  );
};

export default DocumentsSection;


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
  return <div className="mb-8">
      <h2 className="text-xl font-semibold mb-6 text-kb-darkgray">Παραδείγματα Εγγράφων για λήψη  </h2>
      <DocumentsGrid documents={filteredDocuments} allDocuments={filteredDocuments} isAdmin={isAdmin} onViewDocument={onViewDocument} onEditDocument={onEditDocument} onDeleteDocument={onDeleteDocument} />
    </div>;
};
export default DocumentsSection;
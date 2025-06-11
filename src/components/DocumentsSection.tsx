
import React from 'react';
import CategoryFilter from './CategoryFilter';
import DocumentsGrid from './DocumentsGrid';
import { Document } from '../utils/searchUtils';

interface DocumentsSectionProps {
  allDocuments: Document[];
  filteredDocuments: Document[];
  selectedCategory: string;
  isAdmin: boolean;
  onCategoryChange: (category: string) => void;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  allDocuments,
  filteredDocuments,
  selectedCategory,
  isAdmin,
  onCategoryChange,
  onViewDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-6 text-kb-darkgray">Κατηγορίες εγγράφων</h2>
      <CategoryFilter 
        documents={allDocuments}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />
      <DocumentsGrid
        documents={filteredDocuments}
        allDocuments={allDocuments}
        isAdmin={isAdmin}
        onViewDocument={onViewDocument}
        onEditDocument={onEditDocument}
        onDeleteDocument={onDeleteDocument}
      />
    </div>
  );
};

export default DocumentsSection;

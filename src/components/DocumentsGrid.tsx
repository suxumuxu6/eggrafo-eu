
import React from 'react';
import PDFCard from './PDFCard';
import { Document } from '../utils/searchUtils';

interface DocumentsGridProps {
  documents: Document[];
  allDocuments: Document[];
  isAdmin: boolean;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}

const DocumentsGrid: React.FC<DocumentsGridProps> = ({
  documents,
  allDocuments,
  isAdmin,
  onViewDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 auto-rows-fr">
        {documents.map(doc => (
          <PDFCard 
            key={doc.id} 
            title={doc.title} 
            description={doc.description}
            tags={doc.tags}
            category={doc.category}
            onView={() => onViewDocument(doc)}
            onEdit={() => onEditDocument(doc)}
            onDelete={() => onDeleteDocument(doc)}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      {documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {allDocuments.length === 0 
              ? "No documents found. Upload some documents to get started." 
              : "Δεν βρέθηκαν έγγραφα. Δοκιμάστε άλλη κατηγορία ή διαφορετική αναζήτηση."
            }
          </p>
        </div>
      )}
    </>
  );
};

export default DocumentsGrid;

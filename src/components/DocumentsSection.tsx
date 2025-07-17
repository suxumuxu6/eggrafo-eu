import React, { useState } from 'react';
import DocumentsGrid from './DocumentsGrid';
import { Document } from '../utils/searchUtils';
import DonationModal from './DonationModal';
import InlinePDFViewer from './InlinePDFViewer';
interface DocumentsSectionProps {
  filteredDocuments: Document[];
  isAdmin: boolean;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (document: Document) => void;
}
const DONATED_DOCS_KEY = 'donatedDocs';
const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  filteredDocuments,
  isAdmin,
  onViewDocument,
  onEditDocument,
  onDeleteDocument
}) => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [pendingViewDocument, setPendingViewDocument] = useState<Document | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  // Fetch donated document ids from localStorage
  const hasDonatedForDocument = (docId: string) => {
    try {
      const donated = JSON.parse(localStorage.getItem(DONATED_DOCS_KEY) || '[]');
      return Array.isArray(donated) && donated.includes(docId);
    } catch {
      return false;
    }
  };

  // Mark donation complete for this document
  const markDocumentDonated = (docId: string) => {
    try {
      const prev = JSON.parse(localStorage.getItem(DONATED_DOCS_KEY) || '[]');
      const updated = Array.isArray(prev) ? Array.from(new Set([...prev, docId])) : [docId];
      localStorage.setItem(DONATED_DOCS_KEY, JSON.stringify(updated));
    } catch {
      localStorage.setItem(DONATED_DOCS_KEY, JSON.stringify([docId]));
    }
  };

  // Handle user clicking to "View" a document
  const handleViewDocumentWithDonation = (document: Document) => {
    // Admin users skip donation
    if (isAdmin) {
      onViewDocument(document);
      return;
    }
    // If already donated, show PDF directly
    if (hasDonatedForDocument(document.id)) {
      setActiveDoc(document);
      setShowPDFViewer(true);
      return;
    }
    // Otherwise, show donation modal
    setPendingViewDocument(document);
    setShowDonationModal(true);
  };

  // When a donation succeeds, remember it and show document
  const handleDonationSuccess = () => {
    if (pendingViewDocument) {
      markDocumentDonated(pendingViewDocument.id);
      setShowDonationModal(false);
      setActiveDoc(pendingViewDocument);
      setShowPDFViewer(true);
      setPendingViewDocument(null);
    }
  };
  const handleDonationClose = () => {
    setShowDonationModal(false);
    setPendingViewDocument(null);
  };
  const handlePDFViewerClose = () => {
    setShowPDFViewer(false);
    setActiveDoc(null);
  };
  return <div className="mb-8">
      {/* Styled header to match "Νόμοι Εταιρειών" */}
      <div className="w-full border-2 border-kb-blue bg-kb-blue rounded-xl shadow-sm animate-fade-in mb-6">
        <h2 className="text-2xl font-semibold text-white text-center py-4 px-2 m-0">Υποδείγματα Εγγράφων ΓΕΜΗ για λήψη</h2>
      </div>
      <DocumentsGrid documents={filteredDocuments} allDocuments={filteredDocuments} isAdmin={isAdmin} onViewDocument={handleViewDocumentWithDonation} onEditDocument={onEditDocument} onDeleteDocument={onDeleteDocument} />
      {/* Donation modal shown only when needed */}
      {pendingViewDocument && <DonationModal isOpen={showDonationModal} onClose={handleDonationClose} onSuccess={handleDonationSuccess} documentTitle={pendingViewDocument.title} documentId={pendingViewDocument.id} />}
      {/* After donation, show PDF viewer */}
      {activeDoc && showPDFViewer && <InlinePDFViewer document={activeDoc} onClose={handlePDFViewerClose} />}
    </div>;
};
export default DocumentsSection;

import React, { useState, useEffect } from 'react';
import DocumentsHeader from '../components/DocumentsHeader';
import DocumentsSection from '../components/DocumentsSection';
import InlinePDFViewer from '../components/InlinePDFViewer';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../utils/searchUtils';
import FeaturedDocumentsSection from '../components/FeaturedDocumentsSection';
import LiveChatWidget from "../components/LiveChatWidget";

const EXCLUDED_TITLES = [
  "ν. 4072/2012 Προσωπικές Εταιρείες",
  "Πρότυπα Καταστατικά Σύστασης",
  "Ν. 4601/2019 Μετασχηματισμοί",
  "ν. 4919/2022 ΓΕΜΗ" // NEW: exclude this doc from "Παραδείγματα Εγγράφων για λήψη"
];

const Home: React.FC = () => {
  const { isAdmin } = useAuth();
  const { documents: allDocuments, loading, error, searchDocuments, updateDocument, deleteDocument, incrementViewCount } = useDocuments();
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log('searchQuery updated:', searchQuery); // DEBUG
    filterDocuments();
  }, [allDocuments, searchQuery]);

  const filterDocuments = () => {
    let filtered = allDocuments;

    filtered = filtered.filter(
      doc => !EXCLUDED_TITLES.some(
        t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
      )
    );

    if (searchQuery) {
      filtered = searchDocuments(searchQuery).filter(
        doc => !EXCLUDED_TITLES.some(
          t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
        )
      );
    }

    filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    console.log('filterDocuments: filtered result count:', filtered.length, 'query:', searchQuery); // DEBUG
    setFilteredDocuments(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewDocument = (document: Document) => {
    incrementViewCount(document.id);
    setSelectedDocument(document);
  };

  const handleEditDocument = (document: Document) => {
    setDocumentToEdit(document);
    setIsEditModalOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: { title: string; description: string; tags: string[]; category?: string }) => {
    await updateDocument(id, updates);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete.id);
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kb-purple mx-auto mb-4"></div>
            <p className="text-gray-500">Loading documents...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-500 mb-4">Error loading documents: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-kb-purple text-white px-4 py-2 rounded hover:bg-kb-purple/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <DocumentsHeader onSearch={handleSearch} searchQuery={searchQuery} />
        {/* Documents Section moved above Featured Documents Section */}
        <DocumentsSection
          filteredDocuments={filteredDocuments}
          isAdmin={isAdmin}
          onViewDocument={handleViewDocument}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
        />
        {/* Featured Documents Section is now below DocumentsSection */}
        <FeaturedDocumentsSection documents={allDocuments} />
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© Eggrafo.eu 2025</p>
        </div>
      </footer>
      {/* Modals */}
      {selectedDocument && (
        <InlinePDFViewer 
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setDocumentToEdit(null);
        }}
        document={documentToEdit}
        onSave={handleSaveEdit}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        documentTitle={documentToDelete?.title || ''}
        isDeleting={isDeleting}
      />
      <LiveChatWidget />
    </div>
  );
};

export default Home;

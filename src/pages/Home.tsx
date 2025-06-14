import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DocumentsHeader from '../components/DocumentsHeader';
import DocumentsSection from '../components/DocumentsSection';
import InlinePDFViewer from '../components/InlinePDFViewer';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../utils/searchUtils';
import FeaturedDocumentsSection from '../components/FeaturedDocumentsSection';

const EXCLUDED_TITLES = [
  "ν. 4072/2012 Προσωπικές Εταιρείες",
  "Πρότυπα Καταστατικά Σύστασης",
  "Ν. 4601/2019 Μετασχηματισμοί"
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
    filterDocuments();
  }, [allDocuments, searchQuery]);

  const filterDocuments = () => {
    let filtered = allDocuments;

    // Exclude the featured titles
    filtered = filtered.filter(
      doc => !EXCLUDED_TITLES.some(
        t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
      )
    );

    // Apply search filter
    if (searchQuery) {
      filtered = searchDocuments(searchQuery).filter(
        doc => !EXCLUDED_TITLES.some(
          t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
        )
      );
    }

    // Sort by popularity (view count)
    filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

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
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading documents...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500">Error loading documents: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <DocumentsHeader onSearch={handleSearch} searchQuery={searchQuery} />
        {/* Featured Documents Section */}
        <FeaturedDocumentsSection documents={allDocuments} />
        <DocumentsSection
          filteredDocuments={filteredDocuments}
          isAdmin={isAdmin}
          onViewDocument={handleViewDocument}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
        />
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
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DocumentsHeader from '../components/DocumentsHeader';
import DocumentsSection from '../components/DocumentsSection';
import InlinePDFViewer from '../components/InlinePDFViewer';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../utils/searchUtils';

const Home: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { documents: allDocuments, loading, error, searchDocuments, updateDocument, deleteDocument, incrementViewCount } = useDocuments();
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // The AuthProvider will handle the loading state
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterDocuments();
  }, [allDocuments, selectedCategory, searchQuery]);

  const filterDocuments = () => {
    let filtered = allDocuments;

    // Apply search filter
    if (searchQuery) {
      filtered = searchDocuments(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Sort by popularity (view count) when "Όλες" (all) category is selected
    if (selectedCategory === 'all') {
      filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    // Clear search query when changing category to show all documents in that category
    setSearchQuery('');
    setSelectedCategory(category);
  };

  const handleViewDocument = (document: Document) => {
    // Increment view count when document is viewed
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <DocumentsHeader onSearch={handleSearch} searchQuery={searchQuery} />
        <DocumentsSection
          allDocuments={allDocuments}
          filteredDocuments={filteredDocuments}
          selectedCategory={selectedCategory}
          isAdmin={isAdmin}
          onCategoryChange={handleCategoryChange}
          onViewDocument={handleViewDocument}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© D. Lamprou</p>
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

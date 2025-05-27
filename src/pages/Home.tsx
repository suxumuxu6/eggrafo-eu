import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import PDFCard from '../components/PDFCard';
import PDFViewer from '../components/PDFViewer';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../utils/searchUtils';

const Home: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { documents: allDocuments, loading, error, searchDocuments, updateDocument, deleteDocument } = useDocuments();
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setFilteredDocuments(allDocuments);
  }, [allDocuments]);

  const handleSearch = (query: string) => {
    const results = searchDocuments(query);
    setFilteredDocuments(results);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setDocumentToEdit(document);
    setIsEditModalOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: { title: string; description: string; tags: string[] }) => {
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-kb-darkgray">ΕΒΕΑ ΟΕ/ΕΕ PORTAL</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Μέσα στο site μπορείτε βρείτε γνωμοδοτήσεις των νομικών συμβούλων , manuals και άλλα έγγραφα μέσα απο τις κατηγορίες καθώς και την αναζήτηση.
          </p>
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-kb-darkgray">Available Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map(doc => (
              <PDFCard 
                key={doc.id} 
                title={doc.title} 
                description={doc.description}
                tags={doc.tags}
                onView={() => handleViewDocument(doc)}
                onEdit={() => handleEditDocument(doc)}
                onDelete={() => handleDeleteDocument(doc)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {allDocuments.length === 0 
                  ? "No documents found. Upload some documents to get started." 
                  : "No documents found. Try a different search term."
                }
              </p>
            </div>
          )}
        </div>

        <PDFViewer 
          isOpen={isViewerOpen} 
          onClose={() => setIsViewerOpen(false)} 
          document={selectedDocument} 
        />

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
      </main>
    </div>
  );
};

export default Home;

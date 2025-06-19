
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDocuments } from '../../hooks/useDocuments';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import HomeContent from './HomeContent';
import InlinePDFViewer from '../InlinePDFViewer';
import EditDocumentModal from '../EditDocumentModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { useHomeState } from '../../hooks/useHomeState';

const HomePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    documents: allDocuments, 
    loading, 
    error, 
    searchDocuments, 
    updateDocument, 
    deleteDocument, 
    incrementViewCount, 
    fetchDocuments 
  } = useDocuments();

  const {
    filteredDocuments,
    searchQuery,
    selectedDocument,
    isEditModalOpen,
    isDeleteModalOpen,
    documentToEdit,
    documentToDelete,
    isDeleting,
    handleSearch,
    handleViewDocument,
    handleEditDocument,
    handleDeleteDocument,
    closeEditModal,
    closeDeleteModal,
    setSelectedDocument,
    setDeletingState
  } = useHomeState({ documents: allDocuments, searchDocuments });

  console.log('🏠 Home render - loading:', loading, 'documents count:', allDocuments.length, 'error:', error);

  const handleViewDocumentWithIncrement = (document: any) => {
    incrementViewCount(document.id);
    handleViewDocument(document);
  };

  const handleSaveEdit = async (id: string, updates: { title: string; description: string; tags: string[]; category?: string }) => {
    await updateDocument(id, updates);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setDeletingState(true);
    try {
      await deleteDocument(documentToDelete.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingState(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Manual retry triggered');
    fetchDocuments();
  };

  // Show loading state with improved UI
  if (loading) {
    console.log('🔄 Showing loading state');
    return <LoadingState />;
  }

  // Show error state with retry option
  if (error) {
    console.log('❌ Showing error state:', error);
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Show main content
  console.log('✅ Showing main content with documents:', filteredDocuments.length);

  return (
    <>
      <HomeContent
        filteredDocuments={filteredDocuments}
        allDocuments={allDocuments}
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onViewDocument={handleViewDocumentWithIncrement}
        onEditDocument={handleEditDocument}
        onDeleteDocument={handleDeleteDocument}
      />
      
      {selectedDocument && (
        <InlinePDFViewer 
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
      
      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        document={documentToEdit}
        onSave={handleSaveEdit}
      />
      
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        documentTitle={documentToDelete?.title || ''}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default HomePage;


import { useState, useEffect } from 'react';
import { Document } from '../utils/searchUtils';

const EXCLUDED_TITLES = [
  "ν. 4072/2012 Προσωπικές Εταιρείες",
  "Πρότυπα Καταστατικά Σύστασης",
  "Ν. 4601/2019 Μετασχηματισμοί",
  "ν. 4919/2022 ΓΕΜΗ"
];

interface UseHomeStateProps {
  documents: Document[];
  searchDocuments: (query: string) => Document[];
}

export const useHomeState = ({ documents, searchDocuments }: UseHomeStateProps) => {
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log('🔍 Home: searchQuery updated:', searchQuery);
    console.log('📋 Home: allDocuments count:', documents.length);
    filterDocuments();
  }, [documents, searchQuery]);

  const filterDocuments = () => {
    let filtered = documents;

    // Only show documents from "download_example" category for the main DocumentsSection
    filtered = filtered.filter(doc => doc.category === "download_example");

    // Exclude specific titles from the filtered list
    filtered = filtered.filter(
      doc => !EXCLUDED_TITLES.some(
        t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
      )
    );

    if (searchQuery) {
      const searchResults = searchDocuments(searchQuery);
      filtered = searchResults.filter(doc => doc.category === "download_example").filter(
        doc => !EXCLUDED_TITLES.some(
          t => doc.title.trim().toLowerCase() === t.trim().toLowerCase()
        )
      );
    }

    filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    console.log('🎯 Home: filterDocuments result count:', filtered.length, 'query:', searchQuery);
    setFilteredDocuments(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewDocument = (document: Document) => {
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setDocumentToEdit(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  const setDeletingState = (deleting: boolean) => {
    setIsDeleting(deleting);
  };

  return {
    // State
    filteredDocuments,
    searchQuery,
    selectedDocument,
    isEditModalOpen,
    isDeleteModalOpen,
    documentToEdit,
    documentToDelete,
    isDeleting,
    // Actions
    handleSearch,
    handleViewDocument,
    handleEditDocument,
    handleDeleteDocument,
    closeEditModal,
    closeDeleteModal,
    setSelectedDocument,
    setDeletingState
  };
};

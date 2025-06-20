
import { useState, useEffect, useCallback, useRef } from 'react';
import { Document } from '../utils/searchUtils';
import { toast } from 'sonner';
import { cleanupCache, clearCache } from '../utils/cacheUtils';
import { 
  fetchDocumentsFromSupabase, 
  incrementDocumentViewCount, 
  updateDocumentInSupabase, 
  deleteDocumentFromSupabase 
} from '../utils/documentApi';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchDocuments = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    console.log('🔄 Starting document fetch');
    
    try {
      setLoading(true);
      setError(null);
      
      // Run cleanup in background without waiting
      cleanupCache();
      
      const transformedDocuments = await fetchDocumentsFromSupabase();
      
      if (isMountedRef.current) {
        setDocuments(transformedDocuments);
        setError(null);
        console.log('✅ Documents loaded successfully:', transformedDocuments.length);
      }
      
    } catch (err: any) {
      console.error('💥 Fetch error:', err);
      
      if (isMountedRef.current) {
        const errorMessage = err.message || 'Σφάλμα φόρτωσης εγγράφων';
        setError(errorMessage);
        setDocuments([]);
        toast.error(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const incrementViewCount = async (documentId: string) => {
    try {
      await incrementDocumentViewCount(documentId);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, view_count: (doc.view_count || 0) + 1 }
          : doc
      ));
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const updateDocument = async (id: string, updates: { title: string; description: string; tags: string[]; category?: string }) => {
    try {
      await updateDocumentInSupabase(id, updates);

      setDocuments(prev => prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              title: updates.title, 
              description: updates.description, 
              tags: updates.tags,
              category: updates.category || doc.category
            }
          : doc
      ));

      toast.success('Document updated successfully');
    } catch (err: any) {
      console.error('Error updating document:', err);
      toast.error('Failed to update document');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await deleteDocumentFromSupabase(id);

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (err: any) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
      throw err;
    }
  };

  const searchDocuments = (query: string): Document[] => {
    if (!query) return documents;

    const normalizedQuery = query.toLowerCase();
    
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(normalizedQuery) || 
      doc.description.toLowerCase().includes(normalizedQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
      (doc.category && doc.category.toLowerCase().includes(normalizedQuery))
    );
  };

  useEffect(() => {
    console.log('🚀 useDocuments: Initializing');
    isMountedRef.current = true;
    
    // Start fetching immediately - no delays
    fetchDocuments();

    return () => {
      console.log('🔄 useDocuments: Cleanup');
      isMountedRef.current = false;
    };
  }, []); // Only run once on mount

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    searchDocuments,
    updateDocument,
    deleteDocument,
    incrementViewCount,
    clearCache
  };
};

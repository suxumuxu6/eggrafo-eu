
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
  const fetchAttemptRef = useRef(0);

  const fetchDocuments = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (!isMountedRef.current) return;
    
    const currentAttempt = ++fetchAttemptRef.current;
    console.log('🔄 fetchDocuments: Starting attempt', currentAttempt);
    
    try {
      setLoading(true);
      setError(null);
      
      // Run cleanup in background without waiting - this prevents blocking
      cleanupCache();
      
      const transformedDocuments = await fetchDocumentsFromSupabase();
      
      // Only update state if this is still the current attempt and component is mounted
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        setDocuments(transformedDocuments);
        setError(null);
      }
      
    } catch (err: any) {
      console.error('💥 Final error in fetchDocuments:', err);
      
      // Only update state if this is still the current attempt and component is mounted
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        let errorMessage = 'Σφάλμα φόρτωσης εγγράφων';
        
        if (err.message?.includes('timeout')) {
          errorMessage = 'Η φόρτωση διήρκεσε πολύ. Δοκιμάστε ξανά.';
        } else if (err.message?.includes('Failed to fetch')) {
          errorMessage = 'Πρόβλημα σύνδεσης. Ελέγξτε τη σύνδεσή σας στο internet.';
        } else {
          errorMessage = err.message || 'Άγνωστο σφάλμα';
        }
        
        setError(errorMessage);
        setDocuments([]);
        toast.error(errorMessage);
      }
    } finally {
      // Only update loading state if this is still the current attempt and component is mounted
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        console.log('🏁 Setting loading to false for attempt', currentAttempt);
        setLoading(false);
      }
    }
  }, []); // Remove all dependencies to prevent recreating the function

  const incrementViewCount = async (documentId: string) => {
    await incrementDocumentViewCount(documentId);
    
    // Update local state
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, view_count: (doc.view_count || 0) + 1 }
        : doc
    ));
  };

  const updateDocument = async (id: string, updates: { title: string; description: string; tags: string[]; category?: string }) => {
    try {
      await updateDocumentInSupabase(id, updates);

      // Update local state
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

      // Update local state
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
    console.log('🚀 useDocuments: Mounting and fetching documents');
    isMountedRef.current = true;
    fetchDocuments();

    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log('🔄 useDocuments: Unmounting');
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

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
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const fetchDocuments = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const currentAttempt = ++fetchAttemptRef.current;
    console.log('🔄 fetchDocuments: Starting attempt', currentAttempt, 'retry:', retryCountRef.current);
    
    try {
      setLoading(true);
      setError(null);
      
      // Run cleanup in background without waiting
      cleanupCache();
      
      const transformedDocuments = await fetchDocumentsFromSupabase();
      
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        setDocuments(transformedDocuments);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on success
        console.log('✅ Documents loaded successfully:', transformedDocuments.length);
      }
      
    } catch (err: any) {
      console.error('💥 Fetch error in useDocuments:', err);
      
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        const errorMessage = err.message || 'Σφάλμα φόρτωσης εγγράφων';
        
        // Only retry if we haven't exceeded max retries and it's a recoverable error
        if (retryCountRef.current < maxRetries && 
            (err.message?.includes('network') || err.message?.includes('timeout') || err.message?.includes('connection'))) {
          
          retryCountRef.current++;
          console.log(`🔄 Retrying... (${retryCountRef.current}/${maxRetries})`);
          
          // Retry after a delay
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchDocuments();
            }
          }, 2000 * retryCountRef.current); // Exponential backoff
          
          return; // Don't set error state yet, we're retrying
        }
        
        // Set error state after max retries or non-recoverable error
        setError(errorMessage);
        setDocuments([]);
        toast.error(errorMessage);
        retryCountRef.current = 0; // Reset for next manual retry
      }
    } finally {
      if (currentAttempt === fetchAttemptRef.current && isMountedRef.current) {
        console.log('🏁 Setting loading to false for attempt', currentAttempt);
        setLoading(false);
      }
    }
  }, []);

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
    retryCountRef.current = 0;
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

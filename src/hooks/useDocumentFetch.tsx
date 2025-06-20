
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Document } from '../types/document';
import { cleanupCache } from '../utils/cacheUtils';
import { fetchDocumentsFromSupabase } from '../utils/documentApi';

interface UseDocumentFetchProps {
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isMountedRef: React.MutableRefObject<boolean>;
}

export const useDocumentFetch = ({
  setDocuments,
  setLoading,
  setError,
  isMountedRef
}: UseDocumentFetchProps) => {
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
  }, [setDocuments, setLoading, setError, isMountedRef]);

  return { fetchDocuments };
};

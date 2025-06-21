
import { useEffect } from 'react';
import { useDocumentState } from './useDocumentState';
import { useDocumentFetch } from './useDocumentFetch';
import { useDocumentOperations } from './useDocumentOperations';
import { useDocumentSearch } from './useDocumentSearch';
import { clearCache } from '../utils/cacheUtils';

export const useDocuments = () => {
  const {
    documents,
    setDocuments,
    loading,
    setLoading,
    error,
    setError,
    isMountedRef
  } = useDocumentState();

  const { fetchDocuments } = useDocumentFetch({
    setDocuments,
    setLoading,
    setError,
    isMountedRef
  });

  const {
    incrementViewCount,
    updateDocument,
    deleteDocument
  } = useDocumentOperations(setDocuments);

  const { searchDocuments } = useDocumentSearch(documents);

  useEffect(() => {
    console.log('🚀 useDocuments: Initializing fresh');
    isMountedRef.current = true;
    
    // Simple immediate fetch without delays or complex logic
    console.log('🔄 Calling fetchDocuments immediately');
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

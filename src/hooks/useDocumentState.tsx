
import { useState, useRef } from 'react';
import { Document } from '../types/document';

export const useDocumentState = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  return {
    documents,
    setDocuments,
    loading,
    setLoading,
    error,
    setError,
    isMountedRef
  };
};

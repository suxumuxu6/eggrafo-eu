
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '../utils/searchUtils';
import { toast } from 'sonner';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    console.log('🔄 fetchDocuments: Starting...');
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching from Supabase...');
      
      // Clear any existing timeouts and use a shorter, more reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout - aborting');
        controller.abort();
      }, 5000); // Reduced to 5 seconds
      
      // Add retry logic
      let retries = 0;
      const maxRetries = 2;
      let lastError;

      while (retries <= maxRetries) {
        try {
          const { data, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);

          if (fetchError) {
            throw new Error(`Supabase error: ${fetchError.message}`);
          }

          console.log('📊 Supabase response successful:', { count: data?.length || 0 });

          if (!data) {
            console.log('⚠️ No data returned');
            setDocuments([]);
            return;
          }

          // Transform the data
          const transformedDocuments: Document[] = data.map(doc => ({
            id: doc.id,
            title: doc.title || 'Untitled',
            description: doc.description || '',
            tags: Array.isArray(doc.tags) ? doc.tags : [],
            category: doc.category || '',
            url: doc.file_url || '',
            view_count: doc.view_count || 0
          }));

          console.log('✅ Setting documents:', transformedDocuments.length);
          setDocuments(transformedDocuments);
          return; // Success, exit retry loop
          
        } catch (retryError: any) {
          lastError = retryError;
          retries++;
          
          if (retryError.name === 'AbortError') {
            console.log(`⏰ Request ${retries} timed out`);
          } else {
            console.log(`❌ Attempt ${retries} failed:`, retryError.message);
          }
          
          if (retries <= maxRetries) {
            console.log(`🔄 Retrying in ${retries}s... (${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retries * 1000));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
      
    } catch (err: any) {
      console.error('💥 Final error in fetchDocuments:', err);
      
      let errorMessage = 'Σφάλμα φόρτωσης εγγράφων';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Η φόρτωση διήρκεσε πολύ. Δοκιμάστε να καθαρίσετε την cache του browser.';
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Πρόβλημα σύνδεσης. Ελέγξτε τη σύνδεσή σας στο internet.';
      } else {
        errorMessage = err.message || 'Άγνωστο σφάλμα';
      }
      
      setError(errorMessage);
      setDocuments([]);
      toast.error(errorMessage);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, []);

  const incrementViewCount = async (documentId: string) => {
    try {
      const { error } = await supabase.rpc('increment_document_views', {
        document_id: documentId
      });

      if (error) {
        console.error('Error incrementing view count:', error);
        return;
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, view_count: (doc.view_count || 0) + 1 }
          : doc
      ));
    } catch (err: any) {
      console.error('Error incrementing view count:', err);
    }
  };

  const updateDocument = async (id: string, updates: { title: string; description: string; tags: string[]; category?: string }) => {
    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
          category: updates.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

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
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

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

  // Clear browser cache programmatically if needed
  const clearCache = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear localStorage data that might be causing issues
    try {
      const keysToKeep = ['donatedDocs']; // Keep important data
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cache cleared');
    } catch (e) {
      console.log('Could not clear localStorage:', e);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 useDocuments: Mounting and fetching documents');
    fetchDocuments();
  }, [fetchDocuments]);

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

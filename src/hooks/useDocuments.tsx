
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '../utils/searchUtils';
import { toast } from 'sonner';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    console.log('🔄 fetchDocuments: Starting...');
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching from Supabase...');
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { data, fetchError });

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Failed to fetch documents: ${fetchError.message}`);
      }

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
      
    } catch (err: any) {
      console.error('💥 Error in fetchDocuments:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setDocuments([]);
      toast.error(`Failed to load documents: ${errorMessage}`);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

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

  useEffect(() => {
    console.log('🚀 useDocuments: Mounting and fetching documents');
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    searchDocuments,
    updateDocument,
    deleteDocument,
    incrementViewCount
  };
};

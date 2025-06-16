
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '../utils/searchUtils';
import { toast } from 'sonner';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      console.log('🔄 Starting fetchDocuments...');
      setLoading(true);
      setError(null);
      
      // Test Supabase connection first
      console.log('🔗 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('documents')
        .select('count')
        .limit(1);
      
      console.log('📊 Connection test result:', { testData, testError });
      
      if (testError) {
        console.error('❌ Supabase connection failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('✅ Supabase connection successful, fetching documents...');
      
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📄 Raw documents data:', data);
      console.log('❌ Fetch error:', fetchError);

      if (fetchError) {
        console.error('❌ Documents fetch error:', fetchError);
        throw new Error(`Failed to fetch documents: ${fetchError.message}`);
      }

      if (!data) {
        console.log('⚠️ No data returned, setting empty array');
        setDocuments([]);
        return;
      }

      // Transform the data to match our Document interface
      const transformedDocuments: Document[] = data.map(doc => {
        console.log('🔄 Transforming document:', doc);
        return {
          id: doc.id,
          title: doc.title || 'Untitled',
          description: doc.description || '',
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          category: doc.category || '',
          url: doc.file_url || '',
          view_count: doc.view_count || 0
        };
      });

      console.log('✅ Transformed documents:', transformedDocuments);
      setDocuments(transformedDocuments);
      
    } catch (err: any) {
      console.error('💥 Critical error in fetchDocuments:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setDocuments([]); // Set empty array as fallback
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
    console.log('🚀 useDocuments hook mounted, calling fetchDocuments');
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

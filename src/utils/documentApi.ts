
import { supabase } from '@/integrations/supabase/client';
import { Document } from './searchUtils';

export const fetchDocumentsFromSupabase = async (): Promise<Document[]> => {
  console.log('📡 fetchDocumentsFromSupabase called');
  
  try {
    console.log('🔄 Making Supabase query...');
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📊 Supabase response:', { data: data?.length, error });

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No documents found in database');
      return [];
    }

    console.log('🔄 Transforming documents...');
    const transformedDocuments: Document[] = data.map(doc => {
      let fileUrl = doc.file_url || '';
      
      // Simple URL handling
      if (fileUrl && !fileUrl.startsWith('http')) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileUrl);
        fileUrl = urlData?.publicUrl || fileUrl;
      }

      return {
        id: doc.id,
        title: doc.title || 'Untitled',
        description: doc.description || '',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        category: doc.category || '',
        url: fileUrl,
        view_count: doc.view_count || 0
      };
    });

    console.log('✅ Documents transformed successfully:', transformedDocuments.length);
    return transformedDocuments;
    
  } catch (error: any) {
    console.error('❌ fetchDocumentsFromSupabase failed:', error);
    throw new Error('Πρόβλημα φόρτωσης εγγράφων. Δοκιμάστε ξανά.');
  }
};

export const incrementDocumentViewCount = async (documentId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_document_views', {
      document_id: documentId
    });

    if (error) {
      console.error('Error incrementing view count:', error);
    }
  } catch (err: any) {
    console.error('Error incrementing view count:', err);
  }
};

export const updateDocumentInSupabase = async (
  id: string, 
  updates: { title: string; description: string; tags: string[]; category?: string }
): Promise<void> => {
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
};

export const deleteDocumentFromSupabase = async (id: string): Promise<void> => {
  // Get document first
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Delete file from storage if exists
  if (doc?.file_url) {
    try {
      const url = new URL(doc.file_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage deletion failed:', storageError);
      }
    } catch (urlError) {
      console.error('URL parsing failed:', urlError);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw deleteError;
  }
};

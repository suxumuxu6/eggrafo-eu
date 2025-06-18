
import { supabase } from '@/integrations/supabase/client';
import { Document } from './searchUtils';

export const fetchDocumentsFromSupabase = async (): Promise<Document[]> => {
  console.log('📡 Fetching from Supabase...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ Request timeout - aborting');
    controller.abort();
  }, 5000);
  
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
        return [];
      }

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
      return transformedDocuments;
      
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
  
  throw lastError;
};

export const incrementDocumentViewCount = async (documentId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_document_views', {
      document_id: documentId
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      return;
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
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw deleteError;
  }
};

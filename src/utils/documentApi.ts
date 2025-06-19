
import { supabase } from '@/integrations/supabase/client';
import { Document } from './searchUtils';

// Add exponential backoff for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delayTime = baseDelay * Math.pow(2, i);
      console.log(`🔄 Retry ${i + 1}/${maxRetries} after ${delayTime}ms`);
      await delay(delayTime);
    }
  }
  throw new Error('Max retries exceeded');
};

export const fetchDocumentsFromSupabase = async (): Promise<Document[]> => {
  console.log('📡 Starting Supabase fetch with improved retry logic...');
  
  try {
    // Try with retry and exponential backoff
    const data = await retryWithBackoff(async () => {
      console.log('🔄 Attempting Supabase connection...');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Supabase query successful:', { count: data?.length || 0 });
      return data;
    }, 2, 2000); // 2 retries with 2 second base delay

    if (!data || data.length === 0) {
      console.log('⚠️ No documents found, returning empty array');
      return [];
    }

    const transformedDocuments: Document[] = data.map(doc => {
      let fileUrl = doc.file_url || '';
      
      // Ensure the URL is properly formatted for the storage bucket
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
    console.error('❌ All fetch attempts failed:', error);
    
    // Provide more specific error messages based on error type
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      throw new Error('Πρόβλημα εξουσιοδότησης. Παρακαλώ ανανεώστε τη σελίδα.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Πρόβλημα δικτύου. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Η σύνδεση διήρκεσε πολύ. Δοκιμάστε ξανά σε λίγο.');
    } else {
      throw new Error('Πρόβλημα φόρτωσης εγγράφων. Δοκιμάστε ξανά.');
    }
  }
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
  // First get the document to find the file path
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Extract file path from URL for storage deletion
  if (doc?.file_url) {
    try {
      const url = new URL(doc.file_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([fileName]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    } catch (urlError) {
      console.error('Error parsing file URL:', urlError);
      // Continue with database deletion
    }
  }

  // Delete document record from database
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw deleteError;
  }
};

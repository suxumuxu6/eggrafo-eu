
import { supabase } from '@/integrations/supabase/client';
import { Document } from './searchUtils';

export const fetchDocumentsFromSupabase = async (): Promise<Document[]> => {
  console.log('📡 Starting Supabase fetch with timeout protection...');
  
  try {
    // Quick connection test with shorter timeout
    const testController = new AbortController();
    const testTimeoutId = setTimeout(() => testController.abort(), 5000);
    
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('id')
      .limit(1)
      .abortSignal(testController.signal);
    
    clearTimeout(testTimeoutId);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      throw new Error(`Πρόβλημα σύνδεσης με τη βάση δεδομένων: ${testError.message}`);
    }
    
    console.log('✅ Connection test passed, fetching documents...');
    
    // Main query with timeout protection
    const mainController = new AbortController();
    const mainTimeoutId = setTimeout(() => mainController.abort(), 10000);
    
    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .abortSignal(mainController.signal);

    clearTimeout(mainTimeoutId);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw new Error(`Σφάλμα ανάκτησης δεδομένων: ${fetchError.message}`);
    }

    console.log('📊 Raw Supabase response:', { count: data?.length || 0 });

    if (!data || data.length === 0) {
      console.log('⚠️ No data returned, returning empty array');
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
    console.error('❌ Complete fetch error details:', error);
    
    // Handle abort errors specifically
    if (error.name === 'AbortError') {
      throw new Error('Η αίτηση διήρκεσε πολύ. Παρακαλώ δοκιμάστε ξανά.');
    }
    
    // Provide more specific error messages
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      throw new Error('Πρόβλημα εξουσιοδότησης. Παρακαλώ ανανεώστε τη σελίδα.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Πρόβλημα δικτύου. Ελέγξτε τη σύνδεσή σας.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Η αίτηση διήρκεσε πολύ. Δοκιμάστε ξανά.');
    } else {
      throw new Error(error.message || 'Άγνωστο σφάλμα κατά τη φόρτωση');
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

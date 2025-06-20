
import { toast } from 'sonner';
import { Document, DocumentUpdateData } from '../types/document';
import { 
  incrementDocumentViewCount, 
  updateDocumentInSupabase, 
  deleteDocumentFromSupabase 
} from '../utils/documentApi';

export const useDocumentOperations = (
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const incrementViewCount = async (documentId: string) => {
    try {
      await incrementDocumentViewCount(documentId);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, view_count: (doc.view_count || 0) + 1 }
          : doc
      ));
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const updateDocument = async (id: string, updates: DocumentUpdateData) => {
    try {
      await updateDocumentInSupabase(id, updates);

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
      await deleteDocumentFromSupabase(id);

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (err: any) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
      throw err;
    }
  };

  return {
    incrementViewCount,
    updateDocument,
    deleteDocument
  };
};

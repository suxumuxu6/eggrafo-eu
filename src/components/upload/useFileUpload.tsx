
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { requireAdminAuth } from '@/utils/authSecurity';
import { FileUploadService, UploadFormData } from '@/services/fileUploadService';
import { useUploadState } from '@/hooks/useUploadState';
import { DocumentFormData } from './UploadForm';

export const useFileUpload = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const uploadState = useUploadState();

  const uploadDocument = async (formData: DocumentFormData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Μόνο διαχειριστές μπορούν να ανεβάζουν έγγραφα.');
      uploadState.setError('Μόνο διαχειριστές μπορούν να ανεβάζουν έγγραφα.');
      return false;
    }

    if (!user || !user.id) {
      uploadState.setError('You must be logged in as an administrator to upload documents.');
      return false;
    }

    if (!formData.file) {
      uploadState.setError('Please select a PDF file');
      return false;
    }

    const uploadFormData: UploadFormData = {
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      category: formData.category,
      file: formData.file
    };

    uploadState.setUploading(true);
    uploadState.setError(null);

    // Create upload service with progress callback
    const uploadService = new FileUploadService((progress) => {
      uploadState.setProgress(progress.percentage, progress.stage);
    });

    try {
      console.log('🔄 Starting document upload process...');

      // Validate form data
      const validation = uploadService.validateUploadData(uploadFormData);
      if (!validation.isValid) {
        toast.error(validation.error!);
        uploadState.setError(validation.error!);
        return false;
      }

      // Upload file to storage
      const { filePath, fileUrl } = await uploadService.uploadFileToStorage(formData.file);

      try {
        // Save document metadata
        await uploadService.saveDocumentMetadata(uploadFormData, fileUrl, user.id);

        // Final security check before completion
        const isStillAdmin = await requireAdminAuth();
        if (!isStillAdmin) {
          toast.error("Τα δικαιώματα διαχειριστή έχουν ανακληθεί.");
          navigate("/home");
          return false;
        }

        toast.success(`Document "${uploadFormData.title}" uploaded successfully!`);
        navigate('/home');
        return true;

      } catch (metadataError: any) {
        console.error('❌ Metadata save failed:', metadataError);
        uploadState.setError('Error saving document metadata.');
        toast.error('Error saving document metadata: ' + metadataError.message);
        
        // Clean up uploaded file
        await uploadService.cleanupFailedUpload(filePath);
        return false;
      }

    } catch (error: any) {
      console.error('❌ Upload process failed:', error);
      uploadState.setError(error.message || 'Failed to upload document. Please try again.');
      toast.error('Failed to upload document: ' + (error.message || 'Unknown error'));
      return false;
    } finally {
      uploadState.setUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.uploadProgress,
    errorMessage: uploadState.errorMessage,
    currentStage: uploadState.currentStage
  };
};

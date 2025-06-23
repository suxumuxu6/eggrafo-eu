
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
    console.log('🚀 Starting upload process...');
    console.log('User state:', { hasUser: !!user, isAdmin, userId: user?.id });

    // Reset any previous errors
    uploadState.setError(null);
    uploadState.setUploading(true);

    try {
      // First check authentication
      if (!user || !user.id) {
        const errorMsg = 'You must be logged in to upload documents.';
        console.error('❌ No user:', errorMsg);
        uploadState.setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // Check admin status from context first
      if (!isAdmin) {
        console.log('Context shows user is not admin, performing direct check...');
        
        // Perform direct admin verification
        const isValidAdmin = await requireAdminAuth();
        if (!isValidAdmin) {
          const errorMsg = 'Μόνο διαχειριστές μπορούν να ανεβάζουν έγγραφα.';
          console.error('❌ Admin verification failed:', errorMsg);
          uploadState.setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
        console.log('✅ Direct admin verification passed');
      }

      if (!formData.file) {
        const errorMsg = 'Please select a PDF file';
        uploadState.setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      const uploadFormData: UploadFormData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        category: formData.category,
        file: formData.file
      };

      console.log('📋 Upload form data prepared:', {
        title: uploadFormData.title,
        category: uploadFormData.category,
        fileSize: uploadFormData.file.size,
        fileType: uploadFormData.file.type
      });

      // Create upload service with progress callback
      const uploadService = new FileUploadService((progress) => {
        uploadState.setProgress(progress.percentage, progress.stage);
      });

      // Validate form data
      const validation = uploadService.validateUploadData(uploadFormData);
      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.error);
        toast.error(validation.error!);
        uploadState.setError(validation.error!);
        return false;
      }

      console.log('✅ Form validation passed');

      // Upload file to storage
      console.log('📤 Starting file upload...');
      const { filePath, fileUrl } = await uploadService.uploadFileToStorage(formData.file);
      console.log('✅ File uploaded successfully:', { filePath, fileUrl });

      try {
        // Save document metadata
        console.log('💾 Saving metadata...');
        await uploadService.saveDocumentMetadata(uploadFormData, fileUrl, user.id);
        console.log('✅ Metadata saved successfully');

        // Final security check before completion
        const isStillAdmin = await requireAdminAuth();
        if (!isStillAdmin) {
          console.warn('⚠️ Admin status lost during upload process');
          toast.error("Τα δικαιώματα διαχειριστή έχουν ανακληθεί.");
          navigate("/home");
          return false;
        }

        toast.success(`Document "${uploadFormData.title}" uploaded successfully!`);
        console.log('🎉 Upload process completed successfully');
        navigate('/home');
        return true;

      } catch (metadataError: any) {
        console.error('❌ Metadata save failed:', metadataError);
        
        // Clean up uploaded file
        console.log('🧹 Cleaning up uploaded file due to metadata error...');
        await uploadService.cleanupFailedUpload(filePath);
        
        const errorMsg = `Failed to save document information: ${metadataError.message}`;
        uploadState.setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

    } catch (error: any) {
      console.error('❌ Upload process failed:', error);
      const errorMsg = error.message || 'Failed to upload document. Please try again.';
      uploadState.setError(errorMsg);
      toast.error(`Upload failed: ${errorMsg}`);
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

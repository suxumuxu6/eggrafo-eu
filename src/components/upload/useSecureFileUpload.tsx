
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { SecureFileUploadService } from '@/services/secureFileUploadService';
import { getCSRFToken, validateCSRFToken, sanitizeInput, logSecurityEvent } from '@/utils/securityUtils';
import { DocumentFormData } from './UploadForm';

export const useSecureFileUpload = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ percentage: 0, stage: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadDocument = async (formData: DocumentFormData): Promise<boolean> => {
    console.log('🔒 Starting secure upload process...');
    
    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress({ percentage: 10, stage: 'Security validation...' });

    try {
      // CSRF validation
      const csrfToken = getCSRFToken();
      if (!validateCSRFToken(csrfToken)) {
        throw new Error('Security validation failed - invalid CSRF token');
      }

      // Enhanced authentication check
      if (!user || !user.id) {
        await logSecurityEvent('upload_attempt_no_auth');
        throw new Error('Authentication required for secure upload');
      }

      if (!isAdmin) {
        await logSecurityEvent('upload_attempt_non_admin', { userId: user.id });
        throw new Error('Admin privileges required for document upload');
      }

      setUploadProgress({ percentage: 25, stage: 'Validating file...' });

      // Enhanced input sanitization
      const sanitizedData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description || ''),
        category: sanitizeInput(formData.category || ''),
        tags: formData.tags?.map(tag => sanitizeInput(tag)) || [],
        file: formData.file
      };

      // File validation
      if (!sanitizedData.file) {
        throw new Error('No file selected for upload');
      }

      setUploadProgress({ percentage: 50, stage: 'Uploading file securely...' });

      // Use secure file upload service
      const uploadService = new SecureFileUploadService();
      const uploadResult = await uploadService.uploadSecureFile(
        sanitizedData.file,
        {
          title: sanitizedData.title,
          description: sanitizedData.description,
          category: sanitizedData.category,
          tags: sanitizedData.tags
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Secure upload failed');
      }

      setUploadProgress({ percentage: 75, stage: 'Saving metadata...' });

      // Save document metadata with security logging
      const { error: metadataError } = await supabase
        .from('documents')
        .insert({
          title: sanitizedData.title,
          description: sanitizedData.description,
          file_url: uploadResult.fileUrl!,
          category: sanitizedData.category,
          tags: sanitizedData.tags,
          created_by: user.id
        });

      if (metadataError) {
        // Clean up uploaded file on metadata failure
        await uploadService.deleteSecureFile(uploadResult.fileUrl!);
        throw new Error(`Metadata save failed: ${metadataError.message}`);
      }

      setUploadProgress({ percentage: 100, stage: 'Upload completed successfully!' });

      await logSecurityEvent('document_uploaded_successfully', {
        title: sanitizedData.title,
        userId: user.id,
        fileSize: sanitizedData.file.size
      });

      toast.success(`Document "${sanitizedData.title}" uploaded successfully with enhanced security!`);
      navigate('/home');
      return true;

    } catch (error: any) {
      console.error('🔒 Secure upload failed:', error);
      const errorMsg = error.message || 'Secure upload failed. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(`Secure upload failed: ${errorMsg}`);
      
      await logSecurityEvent('document_upload_failed', {
        error: errorMsg,
        userId: user?.id
      });
      
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    errorMessage
  };
};

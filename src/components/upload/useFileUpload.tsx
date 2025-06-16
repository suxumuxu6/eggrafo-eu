
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { DocumentFormData } from './UploadForm';

export const useFileUpload = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadDocument = async (formData: DocumentFormData) => {
    if (!isAdmin) {
      toast.error('Μόνο διαχειριστές μπορούν να ανεβάζουν έγγραφα.');
      setErrorMessage('Μόνο διαχειριστές μπορούν να ανεβάζουν έγγραφα.');
      return false;
    }

    const { title, description, tags, category, file } = formData;

    if (!file) {
      toast.error('Please select a PDF file');
      return false;
    }
    if (!category) {
      toast.error('Παρακαλώ επιλέξτε πού θέλετε να ανέβει το αρχείο.');
      setErrorMessage('Παρακαλώ επιλέξτε πού θέλετε να ανέβει το αρχείο.');
      return false;
    }

    // Enforce file type and max size (10MB)
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      setErrorMessage('Only PDF files are allowed');
      return false;
    }
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      toast.error('Maximum file size is 10MB');
      setErrorMessage('Maximum file size is 10MB');
      return false;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      if (!user || !user.id) {
        throw new Error('You must be logged in as an administrator to upload documents.');
      }
      
      // Create a unique file name with timestamp to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Check that storage bucket is present and private (if not, migration handles creation)
      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Upload file to PRIVATE Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
        });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (uploadError) {
        setErrorMessage("Error uploading PDF. Please try again.");
        toast.error('Error uploading file: ' + uploadError.message);
        return false;
      }

      // Generate a signed URL (private access, 1 hour expiration)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour

      if (signedUrlError || !signedUrlData?.signedUrl) {
        setErrorMessage("Unable to generate a secure file URL.");
        toast.error('Failed to create download link. Please contact admin.');
        return false;
      }
      const fileUrl = signedUrlData.signedUrl;

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      // Save document metadata (category now set properly)
      const { error: metadataError, data: insertData } = await supabase
        .from('documents')
        .insert({
          title, 
          description,
          tags: tagsArray, 
          category, // set the category from form
          file_url: fileUrl,
          created_by: user.id,
        });

      if (metadataError) {
        setErrorMessage('Error saving document metadata.');
        toast.error('Error saving document metadata.');
        return false;
      }

      setUploadProgress(100);

      toast.success(`Document "${title}" uploaded successfully!`);
      navigate('/home');
      return true;
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to upload document. Please try again.');
      toast.error('Failed to upload document. Please try again.');
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


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

      console.log('🔄 Starting file upload to Supabase storage...');

      // Improved progress tracking - start immediately
      setUploadProgress(10);

      // Upload file to Supabase Storage documents bucket with improved options
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        setErrorMessage("Error uploading PDF. Please try again.");
        toast.error('Error uploading file: ' + uploadError.message);
        return false;
      }

      console.log('✅ File uploaded successfully:', uploadData);
      setUploadProgress(70);

      // Generate the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        setErrorMessage("Unable to generate a file URL.");
        toast.error('Failed to create download link. Please contact admin.');
        return false;
      }

      setUploadProgress(85);
      const fileUrl = publicUrlData.publicUrl;
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      console.log('🔄 Saving document metadata to database...');

      // Save document metadata with better error handling
      const { error: metadataError, data: insertData } = await supabase
        .from('documents')
        .insert({
          title, 
          description,
          tags: tagsArray, 
          category,
          file_url: fileUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (metadataError) {
        console.error('❌ Database insert error:', metadataError);
        setErrorMessage('Error saving document metadata.');
        toast.error('Error saving document metadata: ' + metadataError.message);
        
        // Try to clean up the uploaded file
        try {
          await supabase.storage.from('documents').remove([filePath]);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
        
        return false;
      }

      console.log('✅ Document metadata saved successfully:', insertData);
      
      // Complete progress
      setUploadProgress(100);

      toast.success(`Document "${title}" uploaded successfully!`);
      navigate('/home');
      return true;
    } catch (error: any) {
      console.error('❌ Upload process failed:', error);
      setErrorMessage(error.message || 'Failed to upload document. Please try again.');
      toast.error('Failed to upload document: ' + (error.message || 'Unknown error'));
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

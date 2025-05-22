
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { DocumentFormData } from './UploadForm';

export const useFileUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadDocument = async (formData: DocumentFormData) => {
    const { title, description, tags, file } = formData;
    
    if (!file) {
      toast.error('Please select a PDF file');
      return false;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    
    try {
      console.log('Starting file upload process...');
      
      // Check if user is authenticated in our custom auth system
      if (!user) {
        throw new Error('You must be logged in to upload documents');
      }
      
      // Create a unique file name with timestamp to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log(`Uploading file to path: ${filePath}`);
      
      // Set up the storage bucket if it doesn't exist yet
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('documents');
      if (bucketError && bucketError.message.includes('does not exist')) {
        const { error: createBucketError } = await supabase.storage.createBucket('documents', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        if (createBucketError) {
          throw new Error(`Error creating storage bucket: ${createBucketError.message}`);
        }
      }
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      console.log('File uploaded successfully, now saving metadata...');
      
      // Get the public URL for the uploaded file
      const { data: publicURLData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      const fileUrl = publicURLData.publicUrl;
      
      // Convert tags string to array
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
      // Save document metadata to database
      const { error: metadataError } = await supabase
        .from('documents')
        .insert({
          title, 
          description, 
          tags: tagsArray, 
          file_url: fileUrl,
          created_by: user.id || 'admin'
        });
        
      if (metadataError) {
        console.error('Metadata error:', metadataError);
        throw new Error(`Error saving document metadata: ${metadataError.message}`);
      }
      
      toast.success(`Document "${title}" uploaded successfully!`);
      
      // Navigate to home page after success
      navigate('/home');
      
      return true;
    } catch (error: any) {
      console.error('Upload error:', error);
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

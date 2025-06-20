
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
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Start progress immediately
      setUploadProgress(5);

      // Check if documents bucket exists and is accessible
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        console.log('Available buckets:', buckets);
        
        if (bucketsError) {
          console.error('❌ Error listing buckets:', bucketsError);
          throw new Error('Storage configuration error. Please contact admin.');
        }

        const documentsBucket = buckets?.find(bucket => bucket.id === 'documents');
        if (!documentsBucket) {
          throw new Error('Documents storage bucket not found. Please contact admin.');
        }
      } catch (bucketError: any) {
        console.error('❌ Bucket check failed:', bucketError);
        throw new Error('Storage access error. Please try again or contact admin.');
      }

      setUploadProgress(15);

      // Upload file to Supabase Storage with improved error handling
      console.log('📤 Uploading file to storage...');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        
        // Handle specific upload errors
        if (uploadError.message.includes('The resource already exists')) {
          // Try with a different filename
          const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 20)}.${fileExt}`;
          const newFilePath = `${newFileName}`;
          
          const { error: retryError, data: retryData } = await supabase.storage
            .from('documents')
            .upload(newFilePath, file, {
              upsert: false,
              cacheControl: '3600',
            });
            
          if (retryError) {
            throw new Error(`Upload failed: ${retryError.message}`);
          }
          
          console.log('✅ File uploaded successfully on retry:', retryData);
          setUploadProgress(60);
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      } else {
        console.log('✅ File uploaded successfully:', uploadData);
        setUploadProgress(60);
      }

      // Generate the public URL for the uploaded file
      console.log('🔗 Generating public URL...');
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        setErrorMessage("Unable to generate a file URL.");
        toast.error('Failed to create download link. Please contact admin.');
        return false;
      }

      setUploadProgress(75);
      const fileUrl = publicUrlData.publicUrl;
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      console.log('💾 Saving document metadata to database...');

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
          console.log('🧹 Cleaned up uploaded file after metadata error');
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

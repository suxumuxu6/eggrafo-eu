
import { supabase } from "@/integrations/supabase/client";
import { 
  sanitizeInput, 
  validateDocumentTitle, 
  validateDocumentDescription,
  validateFileType,
  validateFileSize,
  sanitizeFilename
} from '@/utils/inputValidation';

export interface UploadFormData {
  title: string;
  description: string;
  tags: string;
  category: string;
  file: File;
}

export interface UploadProgress {
  stage: string;
  percentage: number;
}

export class FileUploadService {
  private onProgress?: (progress: UploadProgress) => void;

  constructor(onProgress?: (progress: UploadProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(stage: string, percentage: number) {
    this.onProgress?.({ stage, percentage });
  }

  validateUploadData(formData: UploadFormData): { isValid: boolean; error?: string } {
    const { title, description, tags, category, file } = formData;

    if (!file) {
      return { isValid: false, error: 'Please select a PDF file' };
    }

    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);

    if (!validateDocumentTitle(sanitizedTitle)) {
      return { isValid: false, error: 'Title must be between 1 and 200 characters' };
    }

    if (!validateDocumentDescription(sanitizedDescription)) {
      return { isValid: false, error: 'Description must be less than 1000 characters' };
    }

    if (!category) {
      return { isValid: false, error: 'Παρακαλώ επιλέξτε πού θέλετε να ανέβει το αρχείο.' };
    }

    const allowedTypes = ['application/pdf'];
    if (!validateFileType(file, allowedTypes)) {
      return { isValid: false, error: 'Only PDF files are allowed' };
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (!validateFileSize(file, maxFileSize)) {
      return { isValid: false, error: 'Maximum file size is 10MB' };
    }

    return { isValid: true };
  }

  async uploadFileToStorage(file: File): Promise<{ filePath: string; fileUrl: string }> {
    this.updateProgress('Preparing file upload', 5);

    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error('Authentication error. Please login again.');
    }

    if (!session) {
      throw new Error('You must be logged in to upload files.');
    }

    this.updateProgress('Checking storage access', 10);

    // Test storage access by trying to list buckets
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error accessing storage:', bucketsError);
        throw new Error(`Storage access denied: ${bucketsError.message}`);
      }

      const documentsBucket = buckets?.find(bucket => bucket.id === 'documents');
      if (!documentsBucket) {
        console.error('❌ Documents bucket not found');
        throw new Error('Documents storage not configured. Please contact administrator.');
      }

      console.log('✅ Storage access verified, bucket found:', documentsBucket);
    } catch (error: any) {
      console.error('❌ Storage verification failed:', error);
      throw new Error(`Storage verification failed: ${error.message}`);
    }

    this.updateProgress('Uploading file', 25);

    // Create a secure file name
    const fileExt = file.name.split('.').pop();
    const sanitizedOriginalName = sanitizeFilename(file.name.replace(`.${fileExt}`, ''));
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomSuffix}-${sanitizedOriginalName}.${fileExt}`;
    const filePath = fileName;

    console.log('📤 Uploading file:', filePath);

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
          contentType: file.type,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        if (uploadError.message.includes('The resource already exists')) {
          // Try with a more unique filename
          const newFileName = `${timestamp}-${Date.now()}-${randomSuffix}-${sanitizedOriginalName}.${fileExt}`;
          const { data: retryData, error: retryError } = await supabase.storage
            .from('documents')
            .upload(newFileName, file, {
              upsert: false,
              cacheControl: '3600',
              contentType: file.type,
            });
            
          if (retryError) {
            throw new Error(`Upload failed after retry: ${retryError.message}`);
          }
          
          console.log('✅ File uploaded successfully on retry:', newFileName);
          this.updateProgress('File uploaded', 70);
          
          // Get public URL for retry upload
          const { data: retryPublicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(newFileName);
            
          return { 
            filePath: newFileName, 
            fileUrl: retryPublicUrlData.publicUrl 
          };
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('✅ File uploaded successfully:', uploadData);
      this.updateProgress('File uploaded', 70);

      // Generate the public URL
      console.log('🔗 Generating public URL...');
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Unable to generate file URL.");
      }

      console.log('✅ Public URL generated:', publicUrlData.publicUrl);
      return { filePath, fileUrl: publicUrlData.publicUrl };

    } catch (error: any) {
      console.error('❌ Storage upload exception:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async saveDocumentMetadata(
    formData: UploadFormData, 
    fileUrl: string, 
    userId: string
  ): Promise<any> {
    this.updateProgress('Saving document metadata', 85);

    const sanitizedTitle = sanitizeInput(formData.title);
    const sanitizedDescription = sanitizeInput(formData.description);
    const sanitizedTags = sanitizeInput(formData.tags);
    const tagsArray = sanitizedTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    console.log('💾 Saving document metadata to database...');

    try {
      const { error: metadataError, data: insertData } = await supabase
        .from('documents')
        .insert({
          title: sanitizedTitle, 
          description: sanitizedDescription,
          tags: tagsArray, 
          category: formData.category,
          file_url: fileUrl,
          created_by: userId,
        })
        .select()
        .single();

      if (metadataError) {
        console.error('❌ Database insert error:', metadataError);
        throw new Error(`Database error: ${metadataError.message}`);
      }

      console.log('✅ Document metadata saved successfully:', insertData);
      this.updateProgress('Upload complete', 100);

      return insertData;
    } catch (error: any) {
      console.error('❌ Metadata save exception:', error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  async cleanupFailedUpload(filePath: string): Promise<void> {
    try {
      console.log('🧹 Cleaning up failed upload:', filePath);
      const { error } = await supabase.storage.from('documents').remove([filePath]);
      if (error) {
        console.error('❌ Cleanup error:', error);
      } else {
        console.log('✅ File cleanup successful');
      }
    } catch (cleanupError) {
      console.error('❌ Failed to cleanup uploaded file:', cleanupError);
    }
  }
}

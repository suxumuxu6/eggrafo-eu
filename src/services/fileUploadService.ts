
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

    // Verify storage bucket accessibility
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
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

    this.updateProgress('Uploading file', 15);

    // Create a secure file name
    const fileExt = file.name.split('.').pop();
    const sanitizedOriginalName = sanitizeFilename(file.name.replace(`.${fileExt}`, ''));
    const fileName = `${Date.now()}-${sanitizedOriginalName}.${fileExt}`;
    const filePath = fileName;

    console.log('📤 Uploading file to storage...');
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type,
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      
      if (uploadError.message.includes('The resource already exists')) {
        // Generate a more unique filename
        const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 20)}-${sanitizedOriginalName}.${fileExt}`;
        const newFilePath = newFileName;
        
        const { error: retryError } = await supabase.storage
          .from('documents')
          .upload(newFilePath, file, {
            upsert: false,
            cacheControl: '3600',
            contentType: file.type,
          });
          
        if (retryError) {
          throw new Error(`Upload failed: ${retryError.message}`);
        }
        
        console.log('✅ File uploaded successfully on retry');
        this.updateProgress('File uploaded', 60);
        
        // Get public URL for retry upload
        const { data: retryPublicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(newFilePath);
          
        return { 
          filePath: newFilePath, 
          fileUrl: retryPublicUrlData.publicUrl 
        };
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    console.log('✅ File uploaded successfully');
    this.updateProgress('File uploaded', 60);

    // Generate the public URL
    console.log('🔗 Generating public URL...');
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Unable to generate a file URL.");
    }

    return { filePath, fileUrl: publicUrlData.publicUrl };
  }

  async saveDocumentMetadata(
    formData: UploadFormData, 
    fileUrl: string, 
    userId: string
  ): Promise<any> {
    this.updateProgress('Saving document metadata', 75);

    const sanitizedTitle = sanitizeInput(formData.title);
    const sanitizedDescription = sanitizeInput(formData.description);
    const sanitizedTags = sanitizeInput(formData.tags);
    const tagsArray = sanitizedTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    console.log('💾 Saving document metadata to database...');

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
      throw new Error('Error saving document metadata: ' + metadataError.message);
    }

    console.log('✅ Document metadata saved successfully:', insertData);
    this.updateProgress('Upload complete', 100);

    return insertData;
  }

  async cleanupFailedUpload(filePath: string): Promise<void> {
    try {
      await supabase.storage.from('documents').remove([filePath]);
      console.log('🧹 Cleaned up uploaded file after metadata error');
    } catch (cleanupError) {
      console.error('Failed to cleanup uploaded file:', cleanupError);
    }
  }
}

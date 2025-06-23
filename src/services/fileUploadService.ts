
import { supabase } from "@/integrations/supabase/client";
import { validateFile, sanitizeFilename, sanitizeInput, logSecurityEvent } from "@/utils/securityUtils";

export interface UploadFormData {
  title: string;
  description: string;
  tags: string[];
  category: string;
  file: File;
}

export interface UploadProgress {
  percentage: number;
  stage: string;
}

export class FileUploadService {
  private progressCallback?: (progress: UploadProgress) => void;

  constructor(progressCallback?: (progress: UploadProgress) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(percentage: number, stage: string) {
    this.progressCallback?.({ percentage, stage });
  }

  validateUploadData(data: UploadFormData): { isValid: boolean; error?: string } {
    // Enhanced validation with security checks
    if (!data.title || sanitizeInput(data.title).length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters' };
    }

    if (!data.file) {
      return { isValid: false, error: 'File is required' };
    }

    // Use enhanced file validation
    const fileValidation = validateFile(data.file);
    if (!fileValidation.isValid) {
      return { isValid: false, error: fileValidation.error };
    }

    return { isValid: true };
  }

  async uploadFileToStorage(file: File): Promise<{ filePath: string; fileUrl: string }> {
    this.updateProgress(25, 'Preparing secure file upload...');

    // Log upload attempt
    await logSecurityEvent('file_upload_started', {
      filename: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Enhanced filename security
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedName = sanitizeFilename(file.name);
    const secureFilename = `${timestamp}_${randomSuffix}_${sanitizedName}`;

    this.updateProgress(50, 'Uploading file to secure storage...');

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(secureFilename, file, {
        cacheControl: '3600',
        upsert: false // Prevent overwriting existing files
      });

    if (error) {
      await logSecurityEvent('file_upload_storage_failed', {
        filename: secureFilename,
        error: error.message
      });
      throw new Error(`Secure storage upload failed: ${error.message}`);
    }

    this.updateProgress(75, 'Generating secure file URL...');

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    await logSecurityEvent('file_upload_storage_success', {
      filename: secureFilename,
      path: data.path
    });

    return {
      filePath: data.path,
      fileUrl: urlData.publicUrl
    };
  }

  async saveDocumentMetadata(
    formData: UploadFormData,
    fileUrl: string,
    userId: string
  ): Promise<void> {
    this.updateProgress(90, 'Saving secure document metadata...');

    // Sanitize all input data
    const sanitizedData = {
      title: sanitizeInput(formData.title),
      description: sanitizeInput(formData.description || ''),
      category: sanitizeInput(formData.category || ''),
      tags: formData.tags?.map(tag => sanitizeInput(tag)) || []
    };

    const { error } = await supabase
      .from('documents')
      .insert({
        title: sanitizedData.title,
        description: sanitizedData.description,
        file_url: fileUrl,
        category: sanitizedData.category,
        tags: sanitizedData.tags,
        created_by: userId
      });

    if (error) {
      await logSecurityEvent('document_metadata_save_failed', {
        title: sanitizedData.title,
        userId,
        error: error.message
      });
      throw new Error(`Failed to save document metadata: ${error.message}`);
    }

    await logSecurityEvent('document_metadata_saved', {
      title: sanitizedData.title,
      userId,
      category: sanitizedData.category
    });

    this.updateProgress(100, 'Document uploaded successfully with security validation!');
  }

  async cleanupFailedUpload(filePath: string): Promise<void> {
    try {
      await supabase.storage
        .from('documents')
        .remove([filePath]);
        
      await logSecurityEvent('failed_upload_cleanup', { filePath });
    } catch (cleanupError) {
      console.error('Failed to cleanup uploaded file:', cleanupError);
      await logSecurityEvent('cleanup_failed', { 
        filePath, 
        error: (cleanupError as Error).message 
      });
    }
  }
}

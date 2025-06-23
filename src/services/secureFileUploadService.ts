
import { supabase } from "@/integrations/supabase/client";
import { validateFile, sanitizeFilename, logSecurityEvent } from "@/utils/securityUtils";
import { requireAdminAuth } from "@/utils/authSecurity";

export class SecureFileUploadService {
  async uploadSecureFile(file: File, metadata: any): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      // Enhanced authentication check
      const isAdmin = await requireAdminAuth();
      if (!isAdmin) {
        await logSecurityEvent('unauthorized_upload_attempt', {
          filename: file.name,
          fileSize: file.size
        });
        return { success: false, error: 'Unauthorized: Admin access required' };
      }

      // Enhanced file validation
      const validation = validateFile(file);
      if (!validation.isValid) {
        await logSecurityEvent('invalid_file_upload_attempt', {
          filename: file.name,
          fileSize: file.size,
          error: validation.error
        });
        return { success: false, error: validation.error };
      }

      // Secure filename generation
      const timestamp = Date.now();
      const sanitizedName = sanitizeFilename(file.name);
      const secureFilename = `${timestamp}_${sanitizedName}`;

      // Upload to secure storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(secureFilename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        await logSecurityEvent('file_upload_failed', {
          filename: secureFilename,
          error: uploadError.message
        });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get secure public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      await logSecurityEvent('file_uploaded_successfully', {
        filename: secureFilename,
        originalName: file.name,
        fileSize: file.size,
        path: uploadData.path
      });

      return { 
        success: true, 
        fileUrl: urlData.publicUrl 
      };

    } catch (error: any) {
      await logSecurityEvent('file_upload_error', {
        filename: file.name,
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.message || 'Upload failed due to security constraints' 
      };
    }
  }

  async deleteSecureFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAdmin = await requireAdminAuth();
      if (!isAdmin) {
        await logSecurityEvent('unauthorized_delete_attempt', { filePath });
        return { success: false, error: 'Unauthorized: Admin access required' };
      }

      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) {
        await logSecurityEvent('file_delete_failed', {
          filePath,
          error: error.message
        });
        throw new Error(error.message);
      }

      await logSecurityEvent('file_deleted_successfully', { filePath });
      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}


import { supabase } from "@/integrations/supabase/client";

export const uploadImageToSupabase = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `chat-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    return urlData?.signedUrl || null;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    return null;
  }
};

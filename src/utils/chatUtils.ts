
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, STORAGE_BUCKET } from "@/types/chat";

export const uploadImageToSupabase = async (file: File): Promise<string | null> => {
  // Ensure bucket exists (no-op if already exists)
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});
  
  // Make unique filename
  const ext = file.name.split('.').pop();
  const filePath = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}`;
  
  const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
    upsert: false,
    cacheControl: "3600",
  });
  
  if (uploadErr) {
    alert("Αποτυχία αποστολής αρχείου εικόνας.");
    return null;
  }
  
  // Get public URL
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
};

export const generateSupportTicketCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const saveChatToSupabase = async (finalMessages: ChatMessage[], email: string, ticketCode: string) => {
  try {
    await supabase.from("chatbot_messages").insert({
      email: email || null,
      messages: finalMessages as unknown as import("@/integrations/supabase/types").Json,
      support_ticket_code: ticketCode,
      ticket_status: "active"
    });
  } catch (err) {
    console.error("Failed to save chatbot conversation:", err);
  }
};

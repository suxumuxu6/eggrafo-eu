
import { supabase } from "@/integrations/supabase/client";

export const saveAdminReplyToDatabase = async (chatId: string, message: string): Promise<void> => {
  const { error } = await supabase
    .from("support_replies")
    .insert({
      chatbot_message_id: chatId,
      sender: "admin",
      message: message
    });

  if (error) {
    throw new Error("Error saving reply to database: " + error.message);
  }
};

export const updateChatbotMessageStatus = async (chatId: string): Promise<void> => {
  const { error } = await supabase
    .from("chatbot_messages")
    .update({
      status: "read",
      last_admin_reply_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  if (error) {
    throw new Error("Error updating message status: " + error.message);
  }
};

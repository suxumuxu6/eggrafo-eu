
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupportReply } from "@/types/adminChatbot";

export const useSupportReplies = () => {
  const [supportReplies, setSupportReplies] = useState<Record<string, SupportReply[]>>({});

  const fetchSupportReplies = async (chatId: string) => {
    const { data: rawData, error } = await supabase
      .from("support_replies")
      .select("*")
      .eq("chatbot_message_id", chatId)
      .order("created_at", { ascending: true });

    if (!error && rawData) {
      const transformedReplies: SupportReply[] = rawData.map(reply => ({
        id: reply.id,
        sender: reply.sender as "user" | "admin",
        message: reply.message,
        created_at: reply.created_at,
        file_url: reply.file_url
      }));
      
      setSupportReplies(prev => ({
        ...prev,
        [chatId]: transformedReplies
      }));
    }
  };

  return {
    supportReplies,
    setSupportReplies,
    fetchSupportReplies
  };
};

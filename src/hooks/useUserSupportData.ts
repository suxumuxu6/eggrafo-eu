
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendChatbotNotification } from "@/utils/notificationApi";

interface ChatMessage {
  sender: "bot" | "user" | "admin";
  text: string;
  imageUrl?: string;
}

interface SupportReply {
  id: string;
  message: string;
  sender: "user" | "admin";
  created_at: string;
  file_url?: string;
}

export const useUserSupportData = () => {
  const [email, setEmail] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationFound, setConversationFound] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSearch = async () => {
    if (!email.trim() || !ticketCode.trim()) {
      toast.error("Παρακαλώ εισάγετε το email και τον κωδικό.");
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Searching for conversation:', { email, ticketCode });
      
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("email", email.trim())
        .eq("support_ticket_code", ticketCode.trim())
        .single();

      if (error || !data) {
        console.error('❌ Search error:', error);
        toast.error("Δεν βρέθηκε συνομιλία με αυτά τα στοιχεία.");
        setConversationFound(false);
        return;
      }

      console.log('✅ Found conversation:', data);

      // Safely cast messages with proper type checking
      const rawMessages = data.messages;
      let messages: ChatMessage[] = [];
      
      if (Array.isArray(rawMessages)) {
        messages = rawMessages
          .filter((msg: any) => 
            msg && 
            typeof msg === 'object' && 
            typeof msg.sender === 'string' && 
            typeof msg.text === 'string'
          )
          .map((msg: any) => ({
            sender: msg.sender as "bot" | "user" | "admin",
            text: msg.text,
            ...(msg.imageUrl && { imageUrl: msg.imageUrl })
          }));
      }
      
      setConversation(messages);
      setChatId(data.id);
      setConversationFound(true);
      
      // Fetch replies with proper type casting
      const { data: repliesData, error: repliesError } = await supabase
        .from("support_replies")
        .select("*")
        .eq("chatbot_message_id", data.id)
        .order("created_at", { ascending: true });

      if (!repliesError && repliesData) {
        console.log('✅ Found replies:', repliesData.length);
        // Transform and type-cast the replies data
        const typedReplies: SupportReply[] = repliesData.map(reply => ({
          id: reply.id,
          message: reply.message,
          sender: reply.sender as "user" | "admin",
          created_at: reply.created_at,
          file_url: reply.file_url
        }));
        setReplies(typedReplies);
      }

      toast.success("Συνομιλία βρέθηκε!");
    } catch (error) {
      console.error("❌ Error searching conversation:", error);
      toast.error("Σφάλμα κατά την αναζήτηση.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !chatId) {
      toast.error("Παρακαλώ εισάγετε ένα μήνυμα.");
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Sending user reply:', { chatId, message: newReply.trim() });
      
      const { data, error } = await supabase
        .from("support_replies")
        .insert({
          chatbot_message_id: chatId,
          sender: "user",
          message: newReply.trim()
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        toast.error("Σφάλμα αποστολής μηνύματος.");
        return;
      }

      console.log('✅ Reply saved to database:', data);

      // Type-cast the returned data
      const newReplyData: SupportReply = {
        id: data.id,
        message: data.message,
        sender: data.sender as "user" | "admin",
        created_at: data.created_at,
        file_url: data.file_url
      };

      // Add to local state
      setReplies(prev => [...prev, newReplyData]);
      
      // Send notification to admin about user reply
      console.log('📧 Sending admin notification for user reply...');
      try {
        const notificationSuccess = await sendChatbotNotification('user_reply', {
          email,
          ticketCode,
          chatId,
          userMessage: newReply.trim()
        });
        
        if (notificationSuccess) {
          console.log('✅ Admin notification sent successfully');
          toast.success("Το μήνυμά σας εστάλη και ο διαχειριστής ειδοποιήθηκε!");
        } else {
          console.error('❌ Failed to send admin notification');
          toast.success("Το μήνυμά σας εστάλη!");
        }
      } catch (notificationError) {
        console.error('❌ Failed to send admin notification:', notificationError);
        toast.success("Το μήνυμά σας εστάλη!");
      }
      
      setNewReply("");
      setUploadedFile(null);
    } catch (error) {
      console.error("❌ Error sending reply:", error);
      toast.error("Σφάλμα αποστολής μηνύματος.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    ticketCode,
    setTicketCode,
    conversation,
    replies,
    newReply,
    setNewReply,
    isLoading,
    conversationFound,
    uploadedFile,
    setUploadedFile,
    handleSearch,
    handleSendReply
  };
};

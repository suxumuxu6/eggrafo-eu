
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";

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

export const generateSupportTicketCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const saveChatToSupabase = async (
  messages: ChatMessage[], 
  email: string, 
  ticketCode: string
): Promise<boolean> => {
  try {
    console.log('Saving chat to Supabase:', { 
      messagesCount: messages.length, 
      email, 
      ticketCode 
    });

    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert({
        email: email,
        messages: messages,
        support_ticket_code: ticketCode,
        ticket_status: 'active',
        status: 'unread',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat:', error);
      return false;
    }

    console.log('Chat saved successfully:', data);

    // Send email notification to admin about new ticket
    try {
      const formData = new FormData();
      formData.append("email", "dldigiweb@gmail.com"); // Admin email
      formData.append("subject", `Νέο αίτημα υποστήριξης: ${ticketCode}`);
      formData.append("message", `Νέο αίτημα υποστήριξης έχει δημιουργηθεί.

Κωδικός: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μπορείτε να δείτε το αίτημα στο admin panel: https://eggrafo.work/admin-chatbot`);
      formData.append("chatId", data.id);
      formData.append("isAdminReply", "false");

      const res = await fetch(
        "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
        {
          method: "POST",
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
          },
          body: formData,
        }
      );

      if (!res.ok) {
        console.warn("Failed to send admin notification:", await res.text());
      } else {
        console.log("Admin notification sent successfully");
      }
    } catch (emailError) {
      console.warn("Failed to send admin notification:", emailError);
    }

    return true;
  } catch (error) {
    console.error('Error in saveChatToSupabase:', error);
    return false;
  }
};

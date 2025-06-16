
import { supabase } from "@/integrations/supabase/client";
import { EmailReplyData, EmailApiResponse } from "@/types/emailReply";

export const sendEmailViaApi = async (
  email: string,
  chatId: string,
  replyData: EmailReplyData
): Promise<EmailApiResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Authentication required. Please log in again.");
  }

  // Get the support ticket code for the notification
  const { data: ticketData } = await supabase
    .from("chatbot_messages")
    .select("support_ticket_code")
    .eq("id", chatId)
    .single();

  const supportTicketCode = ticketData?.support_ticket_code;
  
  // Create simplified notification message
  const notificationMessage = `Αγαπητέ/ή χρήστη,

Έχετε λάβει νέα απάντηση για το αίτημά σας με κωδικό: ${supportTicketCode}

Για να δείτε την απάντηση και να συνεχίσετε τη συνομιλία, παρακαλώ επισκεφτείτε:
https://eggrafo.work/support

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`;
  
  const formData = new FormData();
  formData.append("email", email);
  formData.append("subject", "Νέα απάντηση στο αίτημά σας");
  formData.append("message", notificationMessage);
  formData.append("chatId", chatId);
  formData.append("isAdminReply", "false");
  
  if (replyData.file) {
    formData.append("file", replyData.file);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
        },
        body: formData,
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
    }

    const responseText = await res.text();
    return JSON.parse(responseText);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

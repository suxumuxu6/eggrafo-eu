
import { supabase } from "@/integrations/supabase/client";
import { EmailReplyData, EmailApiResponse } from "@/types/emailReply";
import { sendEmailViaEmailJS, sendEmailViaFormSubmit, sendEmailViaMailto } from "./alternativeEmailApi";

export const sendEmailViaApi = async (
  email: string,
  chatId: string,
  replyData: EmailReplyData
): Promise<EmailApiResponse> => {
  console.log('📧 Attempting to send email via multiple methods...');
  
  // Try alternative methods first (more reliable than Supabase edge function)
  const alternatives = [
    () => sendEmailViaFormSubmit(email, replyData.subject, replyData.body),
    () => sendEmailViaEmailJS(email, replyData.subject, replyData.body, chatId),
  ];

  for (const [index, method] of alternatives.entries()) {
    try {
      console.log(`🔄 Trying email method ${index + 1}...`);
      const result = await method();
      
      if (result.success) {
        console.log(`✅ Email sent successfully via method ${index + 1}`);
        return { success: true, id: `alt-${index + 1}-${Date.now()}` };
      } else {
        console.warn(`⚠️ Method ${index + 1} failed:`, result.error);
      }
    } catch (error) {
      console.warn(`⚠️ Method ${index + 1} error:`, error);
    }
  }

  // Fallback to original Supabase method with shorter timeout
  try {
    console.log('🔄 Falling back to Supabase edge function...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ No session, trying mailto fallback...');
      return await sendEmailViaMailto(email, replyData.subject, replyData.body);
    }

    const { data: ticketData } = await supabase
      .from("chatbot_messages")
      .select("support_ticket_code")
      .eq("id", chatId)
      .single();

    const supportTicketCode = ticketData?.support_ticket_code;
    
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
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Shorter timeout

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
    
  } catch (error: any) {
    console.error('❌ Supabase method failed, trying mailto fallback:', error);
    
    // Final fallback to mailto
    try {
      const result = await sendEmailViaMailto(email, replyData.subject, replyData.body);
      if (result.success) {
        return { success: true, id: `mailto-${Date.now()}` };
      }
    } catch (mailtoError) {
      console.error('❌ All email methods including mailto failed');
    }
    
    throw new Error(`All email methods failed. Last error: ${error.message}`);
  }
};

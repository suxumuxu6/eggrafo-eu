
import { supabase } from "@/integrations/supabase/client";
import { EmailReplyData, EmailApiResponse } from "@/types/emailReply";

export const sendEmailViaApi = async (
  email: string,
  chatId: string,
  replyData: EmailReplyData
): Promise<EmailApiResponse> => {
  console.log('📧 Attempting to send email via Supabase edge function...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session found');
    }

    // Get ticket information
    const { data: ticketData } = await supabase
      .from("chatbot_messages")
      .select("support_ticket_code")
      .eq("id", chatId)
      .single();

    const supportTicketCode = ticketData?.support_ticket_code;
    
    // Create proper notification message based on reply data
    const notificationMessage = `Αγαπητέ/ή χρήστη,

${replyData.body}

Για περισσότερες πληροφορίες ή για να συνεχίσετε τη συνομιλία, επισκεφτείτε:
https://eggrafo.work/support

Με το email σας: ${email}
Κωδικός αιτήματος: ${supportTicketCode}

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`;
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("subject", replyData.subject);
    formData.append("message", notificationMessage);
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "true");
    
    if (replyData.file) {
      formData.append("file", replyData.file);
    }

    console.log('🔄 Sending request to Supabase edge function...');

    const res = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
        },
        body: formData
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
    }

    const responseData = await res.json();
    console.log('✅ Email sent successfully via Supabase edge function:', responseData);
    
    return { success: true, id: responseData.id };
    
  } catch (error: any) {
    console.error('❌ Supabase edge function failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};


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

    // Use Supabase client configuration instead of hardcoded values
    const { data: functionResult, error: functionError } = await supabase.functions.invoke(
      'send-chatbot-reply',
      {
        body: formData,
      }
    );
    
    if (functionError) {
      throw new Error(`Function error: ${functionError.message}`);
    }

    console.log('✅ Email sent successfully via Supabase edge function:', functionResult);
    
    return { success: true, id: functionResult.id };
    
  } catch (error: any) {
    console.error('❌ Supabase edge function failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};


import { supabase } from "@/integrations/supabase/client";
import { EmailReplyData, EmailApiResponse } from "@/types/emailReply";
import { sendChatbotNotification } from "./notificationApi";

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
    
    if (!supportTicketCode) {
      throw new Error('Support ticket code not found');
    }

    // Send admin reply notification to user
    console.log('📧 Sending admin reply notification to user...');
    const notificationSent = await sendChatbotNotification('admin_reply', {
      email: email,
      ticketCode: supportTicketCode,
      chatId: chatId,
      adminMessage: replyData.body
    });

    if (!notificationSent) {
      throw new Error('Failed to send admin reply notification');
    }

    console.log('✅ Admin reply notification sent successfully');
    
    return { success: true, id: 'admin-reply-' + Date.now() };
    
  } catch (error: any) {
    console.error('❌ Email API failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

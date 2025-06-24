
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { sendChatbotNotification } from "./notificationApi";

export const saveChatToSupabase = async (
  messages: ChatMessage[], 
  email: string, 
  ticketCode: string
): Promise<boolean> => {
  try {
    console.log('Starting chat save process:', { 
      messagesCount: messages.length, 
      email, 
      ticketCode 
    });

    // Convert messages to a plain object structure that Supabase can handle
    const messagesData = messages.map(msg => ({
      sender: msg.sender,
      text: msg.text,
      ...(msg.imageUrl && { imageUrl: msg.imageUrl })
    }));

    console.log('Converted messages data:', messagesData);

    const insertData = {
      email: email.trim(),
      messages: messagesData,
      support_ticket_code: ticketCode.trim(),
      ticket_status: 'active',
      status: 'unread',
      submitted_at: new Date().toISOString()
    };

    console.log('Inserting chat data:', insertData);

    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return false;
    }

    console.log('Chat saved successfully with ID:', data.id);

    // Send notifications using the new notification system
    console.log('Starting notification process...');
    
    let adminNotificationSuccess = false;
    let userNotificationSuccess = false;
    
    // Send admin notification for new ticket
    try {
      console.log('Sending admin notification for new ticket...');
      adminNotificationSuccess = await sendChatbotNotification('new_ticket', {
        email,
        ticketCode,
        chatId: data.id
      });
      console.log('Admin notification result:', adminNotificationSuccess);
    } catch (adminError) {
      console.error('Admin notification error:', adminError);
    }

    // Send user welcome notification with access instructions
    try {
      console.log('Sending user notification with access instructions...');
      userNotificationSuccess = await sendChatbotNotification('user_welcome', {
        email,
        ticketCode,
        chatId: data.id
      });
      console.log('User notification result:', userNotificationSuccess);
    } catch (userError) {
      console.error('User notification error:', userError);
    }

    // Add delay to ensure notifications are sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log final status
    console.log('Notification results:', {
      adminNotification: adminNotificationSuccess ? 'success' : 'failed',
      userNotification: userNotificationSuccess ? 'success' : 'failed'
    });

    // Return true if chat was saved (notifications are not critical for the main flow)
    return true;
  } catch (error) {
    console.error('Error in saveChatToSupabase:', error);
    return false;
  }
};

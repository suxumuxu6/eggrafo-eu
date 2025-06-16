
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { sendAdminNotificationForNewTicket, sendUserNotificationForNewTicket } from "./notificationUtils";

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

    // Send notifications with better error handling
    console.log('Starting notification process...');
    
    // Send admin notification first
    try {
      console.log('Sending admin notification...');
      await sendAdminNotificationForNewTicket(email, ticketCode, data.id);
      console.log('Admin notification completed successfully');
    } catch (adminError) {
      console.error('Admin notification failed:', adminError);
      // Continue with user notification even if admin fails
    }

    // Send user notification
    try {
      console.log('Sending user notification...');
      await sendUserNotificationForNewTicket(email, ticketCode, data.id);
      console.log('User notification completed successfully');
    } catch (userError) {
      console.error('User notification failed:', userError);
      // Don't fail the entire operation if user notification fails
    }

    console.log('Chat save and notification process completed');
    return true;
  } catch (error) {
    console.error('Error in saveChatToSupabase:', error);
    return false;
  }
};


import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { sendAdminNotificationForNewTicket, sendUserNotificationForNewTicket } from "./notificationUtils";

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

    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return false;
    }

    console.log('Chat saved successfully:', data);

    // Send email notifications with proper error handling
    try {
      console.log('Starting to send notifications...');
      await sendAdminNotificationForNewTicket(email, ticketCode, data.id);
      console.log('Admin notification completed');
      await sendUserNotificationForNewTicket(email, ticketCode, data.id);
      console.log('User notification completed');
      console.log('Both notifications sent successfully');
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
      // Don't fail the entire save operation if notifications fail
      // The chat is already saved successfully
    }

    return true;
  } catch (error) {
    console.error('Error in saveChatToSupabase:', error);
    return false;
  }
};

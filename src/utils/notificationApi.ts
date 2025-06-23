
const NOTIFICATION_API_URL = "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-notification";

export const sendChatbotNotification = async (
  type: 'new_ticket' | 'user_reply' | 'user_welcome' | 'ticket_closed' | 'admin_reply',
  data: {
    email: string;
    ticketCode: string;
    chatId: string;
    userMessage?: string;
    adminMessage?: string;
  }
): Promise<boolean> => {
  try {
    console.log('🚀 Sending chatbot notification:', { 
      type, 
      email: data.email?.substring(0, 5) + "***", 
      ticketCode: data.ticketCode,
      chatId: data.chatId,
      url: NOTIFICATION_API_URL
    });
    
    const payload = {
      type,
      email: data.email,
      ticketCode: data.ticketCode,
      chatId: data.chatId,
      ...(data.userMessage && { userMessage: data.userMessage }),
      ...(data.adminMessage && { adminMessage: data.adminMessage })
    };

    console.log('📦 Notification payload:', {
      ...payload,
      email: payload.email.substring(0, 5) + "***"
    });

    const response = await fetch(NOTIFICATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Error details:', errorJson);
      } catch (parseError) {
        console.error('❌ Raw error text:', errorText);
      }
      
      return false; // Don't throw, just return false
    }

    const result = await response.json();
    console.log('✅ Notification sent successfully:', result);
    return true;
    
  } catch (error: any) {
    console.error('❌ Failed to send notification:', {
      error: error.message,
      stack: error.stack,
      type,
      email: data.email?.substring(0, 5) + "***"
    });
    return false; // Don't throw, just return false
  }
};

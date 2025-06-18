
const NOTIFICATION_API_URL = "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-notification";

export const sendChatbotNotification = async (
  type: 'new_ticket' | 'user_reply' | 'user_welcome' | 'ticket_closed',
  data: {
    email: string;
    ticketCode: string;
    chatId: string;
    userMessage?: string;
  }
): Promise<boolean> => {
  try {
    console.log('🚀 Sending chatbot notification:', { type, ...data });
    
    const response = await fetch(NOTIFICATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        ...data
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Notification sent successfully:', result);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send notification:', error);
    return false;
  }
};

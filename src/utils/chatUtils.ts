
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";

export const uploadImageToSupabase = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `chat-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    return urlData?.signedUrl || null;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    return null;
  }
};

export const generateSupportTicketCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const sendAdminNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  try {
    const formData = new FormData();
    formData.append("email", "dldigiweb@gmail.com"); // Admin email
    formData.append("subject", `Νέο αίτημα υποστήριξης: ${ticketCode}`);
    formData.append("message", `Νέο αίτημα υποστήριξης έχει δημιουργηθεί.

Κωδικός: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μπορείτε να δείτε το αίτημα στο admin panel: https://eggrafo.work/admin-chatbot`);
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "false");

    const adminRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
        },
        body: formData,
      }
    );

    if (!adminRes.ok) {
      console.warn("Failed to send admin notification:", await adminRes.text());
    } else {
      console.log("Admin notification sent successfully");
    }
  } catch (emailError) {
    console.warn("Failed to send admin notification:", emailError);
  }
};

export const sendUserNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  try {
    const userFormData = new FormData();
    userFormData.append("email", email);
    userFormData.append("subject", `Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`);
    userFormData.append("message", `Αγαπητέ/ή χρήστη,

Το αίτημά σας έχει καταχωρηθεί με επιτυχία!

ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:

1. Επισκεφτείτε τη σελίδα υποστήριξης: https://eggrafo.work/support

2. Εισάγετε τα στοιχεία σας:
   • Email: ${email}
   • Κωδικός: ${ticketCode}

3. Θα μπορείτε να δείτε την πρόοδο του αιτήματός σας και να λάβετε απαντήσεις από την ομάδα μας.

Θα λάβετε ειδοποίηση στο email σας όταν υπάρχει νέα απάντηση.

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`);
    userFormData.append("chatId", chatId);
    userFormData.append("isAdminReply", "false");

    const userRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
        },
        body: userFormData,
      }
    );

    if (!userRes.ok) {
      console.warn("Failed to send user notification:", await userRes.text());
    } else {
      console.log("User notification sent successfully");
    }
  } catch (emailError) {
    console.warn("Failed to send user notification:", emailError);
  }
};

export const sendAdminNotificationForUserReply = async (email: string, ticketCode: string, chatId: string, userMessage: string) => {
  try {
    const formData = new FormData();
    formData.append("email", "dldigiweb@gmail.com"); // Admin email
    formData.append("subject", `Νέα απάντηση από χρήστη: ${ticketCode}`);
    formData.append("message", `Ο χρήστης έστειλε νέα απάντηση.

Κωδικός αιτήματος: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μήνυμα χρήστη: "${userMessage}"

Μπορείτε να δείτε και να απαντήσετε στο αίτημα: https://eggrafo.work/admin-chatbot`);
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "false");

    const adminRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
        },
        body: formData,
      }
    );

    if (!adminRes.ok) {
      console.warn("Failed to send admin notification for user reply:", await adminRes.text());
    } else {
      console.log("Admin notification for user reply sent successfully");
    }
  } catch (emailError) {
    console.warn("Failed to send admin notification for user reply:", emailError);
  }
};

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

    // Send email notifications
    await sendAdminNotificationForNewTicket(email, ticketCode, data.id);
    await sendUserNotificationForNewTicket(email, ticketCode, data.id);

    return true;
  } catch (error) {
    console.error('Error in saveChatToSupabase:', error);
    return false;
  }
};

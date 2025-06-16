
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { sendEmailViaApi } from "./emailApi";

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

    // Send notifications using the working email API method
    console.log('Starting notification process...');
    
    let adminNotificationSuccess = false;
    let userNotificationSuccess = false;
    
    // Send admin notification first
    try {
      console.log('Sending admin notification...');
      const adminEmailData = {
        subject: `Νέο αίτημα υποστήριξης: ${ticketCode}`,
        message: `Νέο αίτημα υποστήριξης έχει δημιουργηθεί.

Κωδικός: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μπορείτε να δείτε το αίτημα στο admin panel: https://eggrafo.work/admin-chatbot`
      };
      
      await sendEmailViaApi("dldigiweb@gmail.com", data.id, adminEmailData);
      adminNotificationSuccess = true;
      console.log('Admin notification sent successfully');
    } catch (adminError) {
      console.error('Admin notification error:', adminError);
    }

    // Send user notification
    try {
      console.log('Sending user notification...');
      const userEmailData = {
        subject: `Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`,
        message: `Αγαπητέ/ή χρήστη,

Το αίτημά σας έχει καταχωρηθεί με επιτυχία!

ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:

1. Επισκεφτείτε τη σελίδα υποστήριξης: https://eggrafo.work/support

2. Εισάγετε τα στοιχεία σας:
   • Email: ${email}
   • Κωδικός: ${ticketCode}

3. Θα μπορείτε να δείτε την πρόοδο του αιτήματός σας και να λάβετε απαντήσεις από την ομάδα μας.

Θα λάβετε ειδοποίηση στο email σας όταν υπάρχει νέα απάντηση.

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`
      };
      
      await sendEmailViaApi(email, data.id, userEmailData);
      userNotificationSuccess = true;
      console.log('User notification sent successfully');
    } catch (userError) {
      console.error('User notification error:', userError);
    }

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

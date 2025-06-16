
import { supabase } from "@/integrations/supabase/client";

export const sendAdminNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  console.log("Sending admin notification for new ticket:", { email, ticketCode, chatId });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session:", session ? "authenticated" : "no session");
    
    const formData = new FormData();
    formData.append("email", "dldigiweb@gmail.com");
    formData.append("subject", `Νέο αίτημα υποστήριξης: ${ticketCode}`);
    formData.append("message", `Νέο αίτημα υποστήριξης έχει δημιουργηθεί.

Κωδικός: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μπορείτε να δείτε το αίτημα στο admin panel: https://eggrafo.work/admin-chatbot`);
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "false");

    console.log("Making request to send admin notification...");
    
    const response = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: formData,
      }
    );

    console.log("Admin notification response:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Admin notification failed:", errorText);
      throw new Error(`Admin notification failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Admin notification sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending admin notification:", error);
    throw error;
  }
};

export const sendUserNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  console.log("Sending user notification for new ticket:", { email, ticketCode, chatId });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session for user notification:", session ? "authenticated" : "no session");
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("subject", `Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`);
    formData.append("message", `Αγαπητέ/ή χρήστη,

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
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "false");

    console.log("Making request to send user notification...");
    
    const response = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: formData,
      }
    );

    console.log("User notification response:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("User notification failed:", errorText);
      throw new Error(`User notification failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("User notification sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending user notification:", error);
    throw error;
  }
};

export const sendAdminNotificationForUserReply = async (email: string, ticketCode: string, chatId: string, userMessage: string) => {
  console.log("Sending admin notification for user reply:", { email, ticketCode, chatId });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session for admin reply notification:", session ? "authenticated" : "no session");
    
    const formData = new FormData();
    formData.append("email", "dldigiweb@gmail.com");
    formData.append("subject", `Νέα απάντηση από χρήστη: ${ticketCode}`);
    formData.append("message", `Ο χρήστης έστειλε νέα απάντηση.

Κωδικός αιτήματος: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μήνυμα χρήστη: "${userMessage}"

Μπορείτε να δείτε και να απαντήσετε στο αίτημα: https://eggrafo.work/admin-chatbot`);
    formData.append("chatId", chatId);
    formData.append("isAdminReply", "false");

    console.log("Making request to send admin reply notification...");
    
    const response = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: formData,
      }
    );

    console.log("Admin reply notification response:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Admin reply notification failed:", errorText);
      throw new Error(`Admin reply notification failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Admin reply notification sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending admin reply notification:", error);
    throw error;
  }
};

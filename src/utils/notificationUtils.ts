
import { supabase } from "@/integrations/supabase/client";

export const sendAdminNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  console.log("Sending admin notification for new ticket:", { email, ticketCode, chatId });
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
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

    console.log("Making request to send-chatbot-reply function...");
    
    const headers: Record<string, string> = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
    };

    // Add authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const adminRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    console.log("Admin notification response status:", adminRes.status);
    
    if (!adminRes.ok) {
      const errorText = await adminRes.text();
      console.error("Failed to send admin notification:", adminRes.status, errorText);
      throw new Error(`Admin notification failed: ${adminRes.status} - ${errorText}`);
    } else {
      const responseData = await adminRes.json();
      console.log("Admin notification sent successfully:", responseData);
    }
  } catch (emailError) {
    console.error("Failed to send admin notification:", emailError);
    throw emailError;
  }
};

export const sendUserNotificationForNewTicket = async (email: string, ticketCode: string, chatId: string) => {
  console.log("Sending user notification for new ticket:", { email, ticketCode, chatId });
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
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

    console.log("Making request to send user notification...");
    
    const headers: Record<string, string> = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
    };

    // Add authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const userRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers,
        body: userFormData,
      }
    );

    console.log("User notification response status:", userRes.status);
    
    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error("Failed to send user notification:", userRes.status, errorText);
      throw new Error(`User notification failed: ${userRes.status} - ${errorText}`);
    } else {
      const responseData = await userRes.json();
      console.log("User notification sent successfully:", responseData);
    }
  } catch (emailError) {
    console.error("Failed to send user notification:", emailError);
    throw emailError;
  }
};

export const sendAdminNotificationForUserReply = async (email: string, ticketCode: string, chatId: string, userMessage: string) => {
  console.log("Sending admin notification for user reply:", { email, ticketCode, chatId, userMessage: userMessage.substring(0, 50) + "..." });
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
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

    console.log("Making request to send admin reply notification...");
    
    const headers: Record<string, string> = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
    };

    // Add authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const adminRes = await fetch(
      "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    console.log("Admin reply notification response status:", adminRes.status);
    
    if (!adminRes.ok) {
      const errorText = await adminRes.text();
      console.error("Failed to send admin notification for user reply:", adminRes.status, errorText);
      throw new Error(`Admin reply notification failed: ${adminRes.status} - ${errorText}`);
    } else {
      const responseData = await adminRes.json();
      console.log("Admin notification for user reply sent successfully:", responseData);
    }
  } catch (emailError) {
    console.error("Failed to send admin notification for user reply:", emailError);
    throw emailError;
  }
};

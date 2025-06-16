
import { supabase } from "@/integrations/supabase/client";

const RESEND_API_KEY = 're_123456789'; // You'll need to replace this with your actual Resend API key

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

const sendDirectEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('Sending email directly via Resend API:', { to: emailData.to, subject: emailData.subject });
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Eggrafo Support <support@eggrafo.work>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully via Resend:', result);
    return true;
  } catch (error) {
    console.error('Direct email sending failed:', error);
    return false;
  }
};

export const sendAdminNotificationForNewTicket = async (
  email: string, 
  ticketCode: string, 
  chatId: string
): Promise<boolean> => {
  console.log('Sending admin notification for new ticket:', { email, ticketCode, chatId });
  
  const emailData: EmailData = {
    to: 'dldigiweb@gmail.com',
    subject: `Νέο αίτημα υποστήριξης: ${ticketCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Νέο Αίτημα Υποστήριξης</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p><strong>Κωδικός αιτήματος:</strong> ${ticketCode}</p>
          <p><strong>Email χρήστη:</strong> ${email}</p>
          <p><strong>Χρόνος δημιουργίας:</strong> ${new Date().toLocaleString('el-GR')}</p>
          <p><strong>Chat ID:</strong> ${chatId}</p>
          <hr style="margin: 20px 0;">
          <p>Μπορείτε να δείτε και να απαντήσετε στο αίτημα στο admin panel:</p>
          <a href="https://eggrafo.work/admin-chatbot" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Άνοιγμα Admin Panel</a>
        </div>
      </div>
    `
  };

  return await sendDirectEmail(emailData);
};

export const sendUserNotificationForNewTicket = async (
  email: string, 
  ticketCode: string, 
  chatId: string
): Promise<boolean> => {
  console.log('Sending user notification for new ticket:', { email, ticketCode, chatId });
  
  const emailData: EmailData = {
    to: email,
    subject: `Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Eggrafo Support - Αίτημα Καταχωρήθηκε</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p>Αγαπητέ/ή χρήστη,</p>
          
          <p>Το αίτημά σας έχει καταχωρηθεί με επιτυχία!</p>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0066cc;">ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:</h3>
            
            <p><strong>1.</strong> Επισκεφτείτε τη σελίδα υποστήριξης: 
            <a href="https://eggrafo.work/support" style="color: #0066cc;">https://eggrafo.work/support</a></p>
            
            <p><strong>2.</strong> Εισάγετε τα στοιχεία σας:</p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Κωδικός:</strong> <span style="background-color: #fff3cd; padding: 2px 6px; font-family: monospace; font-weight: bold;">${ticketCode}</span></li>
            </ul>
            
            <p><strong>3.</strong> Θα μπορείτε να δείτε την πρόοδο του αιτήματός σας και να λάβετε απαντήσεις από την ομάδα μας.</p>
          </div>
          
          <p>Θα λάβετε ειδοποίηση στο email σας όταν υπάρχει νέα απάντηση.</p>
          
          <p>Με εκτίμηση,<br>
          Η ομάδα υποστήριξης eggrafo.work</p>
        </div>
      </div>
    `
  };

  return await sendDirectEmail(emailData);
};

export const sendAdminNotificationForUserReply = async (
  email: string, 
  ticketCode: string, 
  chatId: string, 
  userMessage: string
): Promise<boolean> => {
  console.log('Sending admin notification for user reply:', { email, ticketCode, chatId });
  
  const emailData: EmailData = {
    to: 'dldigiweb@gmail.com',
    subject: `Νέα απάντηση από χρήστη: ${ticketCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Νέα Απάντηση από Χρήστη</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p><strong>Κωδικός αιτήματος:</strong> ${ticketCode}</p>
          <p><strong>Email χρήστη:</strong> ${email}</p>
          <p><strong>Χρόνος απάντησης:</strong> ${new Date().toLocaleString('el-GR')}</p>
          <p><strong>Chat ID:</strong> ${chatId}</p>
          <hr style="margin: 20px 0;">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <h4 style="margin: 0 0 10px 0;">Μήνυμα χρήστη:</h4>
            <p style="font-style: italic; margin: 0;">"${userMessage}"</p>
          </div>
          <hr style="margin: 20px 0;">
          <p>Μπορείτε να δείτε και να απαντήσετε στο αίτημα:</p>
          <a href="https://eggrafo.work/admin-chatbot" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Απάντηση στο Αίτημα</a>
        </div>
      </div>
    `
  };

  return await sendDirectEmail(emailData);
};


// Alternative email API using EmailJS (free service, no backend needed)
// This is a backup solution that doesn't require server configuration

interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Free EmailJS configuration - user needs to set this up
const EMAIL_CONFIG: EmailJSConfig = {
  serviceId: 'YOUR_SERVICE_ID', // User needs to replace
  templateId: 'YOUR_TEMPLATE_ID', // User needs to replace  
  publicKey: 'YOUR_PUBLIC_KEY' // User needs to replace
};

export const sendEmailViaEmailJS = async (
  toEmail: string,
  subject: string,
  message: string,
  chatId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if EmailJS is configured
    if (EMAIL_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
      throw new Error('EmailJS not configured. Please set up your EmailJS credentials.');
    }

    // Dynamic import of EmailJS to avoid bundle size issues
    const emailjs = await import('@emailjs/browser');
    
    const templateParams = {
      to_email: toEmail,
      subject: subject,
      message: message,
      chat_id: chatId || '',
      from_name: 'Eggrafo Support'
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams,
      EMAIL_CONFIG.publicKey
    );

    console.log('✅ Email sent via EmailJS:', response);
    return { success: true };

  } catch (error: any) {
    console.error('❌ EmailJS error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via EmailJS' 
    };
  }
};

export const sendEmailViaFormSubmit = async (
  toEmail: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Using formsubmit.co as a free alternative
    const formData = new FormData();
    formData.append('email', toEmail);
    formData.append('subject', subject);
    formData.append('message', message);
    formData.append('_replyto', 'support@eggrafo.work');
    formData.append('_captcha', 'false');

    const response = await fetch('https://formsubmit.co/ajax/support@eggrafo.work', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('✅ Email sent via FormSubmit');
      return { success: true };
    } else {
      throw new Error('FormSubmit request failed');
    }

  } catch (error: any) {
    console.error('❌ FormSubmit error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via FormSubmit' 
    };
  }
};

// Simple SMTP.js alternative (frontend only)
export const sendEmailViaSMTPJS = async (
  toEmail: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // This requires SMTP.js library and SMTP configuration
    // User would need to include: <script src="https://smtpjs.com/v3/smtp.js"></script>
    
    const Email = (window as any).Email;
    if (!Email) {
      throw new Error('SMTP.js not loaded. Include the SMTP.js script in your HTML.');
    }

    await Email.send({
      Host: "smtp.elasticemail.com", // Or other SMTP service
      Username: "your-email@domain.com", // User needs to configure
      Password: "your-smtp-password", // User needs to configure
      To: toEmail,
      From: "support@eggrafo.work",
      Subject: subject,
      Body: message
    });

    console.log('✅ Email sent via SMTP.js');
    return { success: true };

  } catch (error: any) {
    console.error('❌ SMTP.js error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via SMTP.js' 
    };
  }
};

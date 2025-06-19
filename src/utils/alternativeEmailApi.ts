
// Alternative email API using multiple methods
// This provides backup solutions that don't require complex server configuration

interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// EmailJS configuration as backup only
const EMAIL_CONFIG: EmailJSConfig = {
  serviceId: 'service_6fui1o8',
  templateId: 'template_cj85kob',
  publicKey: '3V6L-0Mdffs0IUKhP'
};

export const sendEmailViaEmailJS = async (
  toEmail: string,
  subject: string,
  message: string,
  chatId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Dynamic import of EmailJS
    const emailjs = await import('@emailjs/browser');
    
    const templateParams = {
      to_email: toEmail,
      subject: subject,
      message: message,
      chat_id: chatId || '',
      from_name: 'Eggrafo Support'
    };

    console.log('📧 Sending email via EmailJS with params:', templateParams);

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
    const response = await fetch('https://formsubmit.co/ajax/support@eggrafo.work', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _to: toEmail,
        _subject: subject,
        message: message,
        _replyto: 'support@eggrafo.work',
        _captcha: false
      })
    });

    if (response.ok) {
      console.log('✅ Email sent via FormSubmit');
      return { success: true };
    } else {
      throw new Error(`FormSubmit request failed: ${response.status}`);
    }

  } catch (error: any) {
    console.error('❌ FormSubmit error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via FormSubmit' 
    };
  }
};

// Simple mailto fallback (opens user's email client)
export const sendEmailViaMailto = async (
  toEmail: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const encodedSubject = encodeURIComponent(subject);
    const encodedMessage = encodeURIComponent(message);
    const mailtoUrl = `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedMessage}`;
    
    // Open the user's email client
    window.open(mailtoUrl, '_self');
    
    console.log('✅ Email client opened via mailto');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Mailto error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to open email client' 
    };
  }
};


// Alternative email API using multiple methods
// This provides backup solutions that don't require complex server configuration

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
      console.log('⚠️ EmailJS not configured, skipping...');
      return { 
        success: false, 
        error: 'EmailJS not configured. Please set up your EmailJS credentials.' 
      };
    }

    // Dynamic import of EmailJS
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
    formData.append('_to', toEmail);
    formData.append('_subject', subject);
    formData.append('message', message);
    formData.append('_replyto', 'support@eggrafo.work');
    formData.append('_captcha', 'false');
    formData.append('_template', 'table');

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

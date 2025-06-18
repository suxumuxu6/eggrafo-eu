
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req: Request) => {
  console.log("Received request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, ticketCode, chatId, userMessage } = await req.json();
    
    console.log("Notification request:", { type, email, ticketCode, chatId });

    let emailData;
    
    switch (type) {
      case "new_ticket":
        emailData = {
          to: "dldigiweb@gmail.com",
          subject: `Νέο αίτημα υποστήριξης: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Νέο αίτημα υποστήριξης</h2>
              <p><strong>Κωδικός:</strong> ${ticketCode}</p>
              <p><strong>Email χρήστη:</strong> ${email}</p>
              <p><strong>Χρόνος:</strong> ${new Date().toLocaleString('el-GR')}</p>
              <p><strong>Chat ID:</strong> ${chatId}</p>
              <br>
              <p>Μπορείτε να δείτε το αίτημα στο admin panel:</p>
              <a href="https://eggrafo.work/admin-chatbot" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Προβολή Αιτήματος</a>
            </div>
          `
        };
        break;
        
      case "user_reply":
        emailData = {
          to: "dldigiweb@gmail.com",
          subject: `Νέα απάντηση από χρήστη: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Νέα απάντηση από χρήστη</h2>
              <p><strong>Κωδικός αιτήματος:</strong> ${ticketCode}</p>
              <p><strong>Email χρήστη:</strong> ${email}</p>
              <p><strong>Χρόνος:</strong> ${new Date().toLocaleString('el-GR')}</p>
              <br>
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007cba; margin: 20px 0;">
                <p><strong>Μήνυμα χρήστη:</strong></p>
                <p style="font-style: italic;">"${userMessage}"</p>
              </div>
              <br>
              <p>Μπορείτε να δείτε και να απαντήσετε στο αίτημα:</p>
              <a href="https://eggrafo.work/admin-chatbot" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Απάντηση</a>
            </div>
          `
        };
        break;
        
      case "user_welcome":
        emailData = {
          to: email,
          subject: `Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin: 0;">Eggrafo Support</h2>
              </div>
              
              <h3 style="color: #333;">Το αίτημά σας έχει καταχωρηθεί επιτυχώς!</h3>
              
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1565c0; margin-top: 0;">📧 ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:</h4>
                
                <p><strong>1️⃣ Επισκεφτείτε τη σελίδα υποστήριξης:</strong></p>
                <p><a href="https://eggrafo.work/support" style="color: #1565c0;">https://eggrafo.work/support</a></p>
                
                <p><strong>2️⃣ Εισάγετε τα στοιχεία σας:</strong></p>
                <ul>
                  <li>Email: ${email}</li>
                  <li>Κωδικός: <strong>${ticketCode}</strong></li>
                </ul>
                
                <p><strong>3️⃣ Θα μπορείτε να:</strong></p>
                <ul>
                  <li>✓ Δείτε την πρόοδο του αιτήματός σας</li>
                  <li>✓ Λάβετε απαντήσεις από την ομάδα μας</li>
                  <li>✓ Στείλετε επιπλέον μηνύματα</li>
                </ul>
              </div>
              
              <p style="color: #666;">🔔 Θα λάβετε ειδοποίηση στο email σας όταν υπάρχει νέα απάντηση από την ομάδα υποστήριξης.</p>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; color: #666;">Ευχαριστούμε για την επικοινωνία!</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Η ομάδα υποστήριξης eggrafo.work</p>
              </div>
            </div>
          `
        };
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log("Sending email via Resend...", { to: emailData.to, subject: emailData.subject });
    
    const sendResult = await resend.emails.send({
      from: "Eggrafo Support <support@eggrafo.work>",
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log("Resend API response:", sendResult);

    if (sendResult.error) {
      console.error("Resend API error:", sendResult.error);
      return new Response(JSON.stringify({ 
        error: `Email sending failed: ${sendResult.error.message}` 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Email sent successfully. ID:", sendResult.data?.id);
    return new Response(JSON.stringify({ 
      success: true, 
      id: sendResult.data?.id,
      message: "Email sent successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown server error";
    return new Response(
      JSON.stringify({ 
        error: `Server error: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

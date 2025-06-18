
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req: Request) => {
  console.log("Received request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const requestBody = await req.json();
    const { type, email, ticketCode, chatId, userMessage } = requestBody;
    
    console.log("Processing notification:", { type, email, ticketCode, chatId });

    if (!type || !email || !ticketCode || !chatId) {
      throw new Error("Missing required fields");
    }

    let emailData;
    
    switch (type) {
      case "new_ticket":
        emailData = {
          to: "dldigiweb@gmail.com",
          subject: `🆕 Νέο αίτημα υποστήριξης: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">🆕 Νέο Αίτημα Υποστήριξης</h2>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📋 Κωδικός:</strong> <span style="color: #dc2626; font-weight: bold;">${ticketCode}</span></p>
                <p style="margin: 5px 0;"><strong>👤 Email χρήστη:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>🕒 Χρόνος:</strong> ${new Date().toLocaleString('el-GR')}</p>
                <p style="margin: 5px 0;"><strong>🆔 Chat ID:</strong> ${chatId}</p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://eggrafo.work/admin-chatbot" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  📝 Προβολή & Απάντηση
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
                Eggrafo.work Support System
              </p>
            </div>
          `
        };
        break;
        
      case "user_reply":
        emailData = {
          to: "dldigiweb@gmail.com",
          subject: `💬 Νέα απάντηση από χρήστη: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #059669; margin-bottom: 20px;">💬 Νέα Απάντηση από Χρήστη</h2>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📋 Κωδικός αιτήματος:</strong> <span style="color: #dc2626; font-weight: bold;">${ticketCode}</span></p>
                <p style="margin: 5px 0;"><strong>👤 Email χρήστη:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>🕒 Χρόνος:</strong> ${new Date().toLocaleString('el-GR')}</p>
              </div>
              
              <div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #059669; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="margin: 0 0 10px 0;"><strong>📝 Μήνυμα χρήστη:</strong></p>
                <p style="font-style: italic; color: #374151; margin: 0;">"${userMessage}"</p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://eggrafo.work/admin-chatbot" 
                   style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  💬 Απάντηση
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
                Eggrafo.work Support System
              </p>
            </div>
          `
        };
        break;
        
      case "user_welcome":
        emailData = {
          to: email,
          subject: `🎫 Κωδικός πρόσβασης για το αίτημά σας: ${ticketCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #333; margin: 0;">🏢 Eggrafo Support</h2>
              </div>
              
              <h3 style="color: #333;">✅ Το αίτημά σας έχει καταχωρηθεί επιτυχώς!</h3>
              
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1565c0; margin-top: 0;">📧 ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:</h4>
                
                <p><strong>1️⃣ Επισκεφτείτε τη σελίδα υποστήριξης:</strong></p>
                <p><a href="https://eggrafo.work/support" style="color: #1565c0; font-weight: bold;">https://eggrafo.work/support</a></p>
                
                <p><strong>2️⃣ Εισάγετε τα στοιχεία σας:</strong></p>
                <ul style="background-color: #fff; padding: 15px; border-radius: 6px;">
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>Κωδικός:</strong> <span style="color: #dc2626; font-weight: bold; background-color: #fef2f2; padding: 2px 6px; border-radius: 4px;">${ticketCode}</span></li>
                </ul>
                
                <p><strong>3️⃣ Θα μπορείτε να:</strong></p>
                <ul>
                  <li>✅ Δείτε την πρόοδο του αιτήματός σας</li>
                  <li>✅ Λάβετε απαντήσεις από την ομάδα μας</li>
                  <li>✅ Στείλετε επιπλέον μηνύματα</li>
                </ul>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">🔔 <strong>Ειδοποιήσεις:</strong> Θα λάβετε email όταν υπάρχει νέα απάντηση από την ομάδα υποστήριξης.</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; color: #666;">Ευχαριστούμε για την επικοινωνία! 🙏</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Η ομάδα υποστήριξης eggrafo.work</p>
              </div>
            </div>
          `
        };
        break;

      case "ticket_closed":
        emailData = {
          to: email,
          subject: `✅ Το αίτημά σας ${ticketCode} έχει κλείσει`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #333; margin: 0;">🏢 Eggrafo Support</h2>
              </div>
              
              <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="color: #155724; margin-top: 0;">✅ Αίτημα Ολοκληρώθηκε</h3>
                <p style="color: #155724; margin: 10px 0;">Αγαπητέ/ή χρήστη,</p>
                <p style="color: #155724; margin: 10px 0;">Το αίτημά σας με κωδικό: <strong>${ticketCode}</strong> έχει κλείσει και ολοκληρωθεί.</p>
                <p style="color: #155724; margin: 10px 0;">Με εκτίμηση,<br>Η ομάδα υποστήριξης eggrafo.work</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Εάν έχετε άλλες ερωτήσεις, μη διστάσετε να επικοινωνήσετε μαζί μας!</p>
              </div>
            </div>
          `
        };
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log("Sending email via Resend to:", emailData.to);
    
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

    console.log("✅ Email sent successfully. ID:", sendResult.data?.id);
    return new Response(JSON.stringify({ 
      success: true, 
      id: sendResult.data?.id,
      message: "Email sent successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error) {
    console.error("❌ Edge function error:", error);
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

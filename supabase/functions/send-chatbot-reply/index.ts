
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
    const formData = await req.formData();
    console.log("FormData received, processing...");

    const email = formData.get("email")?.toString();
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString();
    const file = formData.get("file") as File | undefined;
    const chatId = formData.get("chatId")?.toString();
    const isAdminReply = formData.get("isAdminReply")?.toString() === "true";

    console.log("Email data:", { 
      email, 
      subject, 
      messageLength: message?.length, 
      hasFile: !!file, 
      chatId, 
      isAdminReply 
    });

    if (!email || !subject || !message) {
      console.error("Missing required fields:", { 
        hasEmail: !!email, 
        hasSubject: !!subject, 
        hasMessage: !!message 
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, subject, or message" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare attachments
    const attachments: any[] = [];
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        attachments.push({
          filename: file.name,
          content: Buffer.from(arrayBuffer),
          contentType: file.type || "application/pdf",
        });
        console.log("File attachment prepared:", file.name, file.size, "bytes");
      } catch (fileError) {
        console.error("Error processing file:", fileError);
        return new Response(
          JSON.stringify({ error: "Error processing file attachment" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Determine from email address
    const fromEmail = subject.includes("έχει κλείσει") 
      ? "non-reply@eggrafo.work" 
      : "support@eggrafo.work";
    
    console.log("Sending email via Resend...", { from: fromEmail, to: email });
    
    const sendResult = await resend.emails.send({
      from: `Eggrafo Support <${fromEmail}>`,
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">Eggrafo Support</h2>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="color: #333; line-height: 1.6; margin: 0;">${message.replace(/\n/g, "<br />")}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 10px; font-size: 12px; color: #666;">
            <p>Αυτό το email στάλθηκε από το σύστημα υποστήριξης του eggrafo.work</p>
          </div>
        </div>
      `,
      attachments: attachments.length ? attachments : undefined,
    });

    console.log("Resend API response:", sendResult);

    if (sendResult.error) {
      console.error("Resend API error:", sendResult.error);
      return new Response(JSON.stringify({ 
        error: `Email sending failed: ${sendResult.error.message || JSON.stringify(sendResult.error)}` 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Save admin replies to database
    if (isAdminReply && chatId) {
      console.log("Saving admin reply to database...");
      
      try {
        const supabaseServiceRole = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: insertData, error: dbError } = await supabaseServiceRole
          .from("chatbot_replies")
          .insert({
            chatbot_message_id: chatId,
            email: email,
            subject: subject,
            body: message,
            file_url: null,
          });

        if (dbError) {
          console.error("Database insert error:", dbError);
        } else {
          console.log("Admin reply saved to database successfully");
        }
      } catch (dbException) {
        console.error("Database operation exception:", dbException);
      }
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

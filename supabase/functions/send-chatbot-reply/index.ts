
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
  console.log("Received request:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    console.log("FormData received");

    const email = formData.get("email")?.toString();
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString();
    const file = formData.get("file") as File | undefined;
    const chatId = formData.get("chatId")?.toString();
    const isAdminReply = formData.get("isAdminReply")?.toString() === "true";

    console.log("Parsed data:", { email, subject, messageLength: message?.length, hasFile: !!file, chatId, isAdminReply });

    if (!email || !subject || !message) {
      console.error("Missing required fields:", { email: !!email, subject: !!subject, message: !!message });
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, subject, or message" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const attachments: any[] = [];
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        attachments.push({
          filename: file.name,
          content: Buffer.from(arrayBuffer),
          contentType: file.type || "application/pdf",
        });
        console.log("File attachment prepared:", file.name);
      } catch (fileError) {
        console.error("Error processing file:", fileError);
        return new Response(
          JSON.stringify({ error: "Error processing file attachment" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Use your verified email address or a domain you've verified with Resend
    const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
    
    // Create reply link - use the request origin to get the correct base URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || "https://eggrafo.work";
    const replyLink = chatId ? `${origin}/reply?chat=${chatId}` : null;
    
    // Add signature and reply link to the message
    let messageWithSignature = `${message}\n\n---\nSupport Team - Eggrafo.work`;
    
    if (replyLink) {
      messageWithSignature += `\n\nΓια να απαντήσετε στο μήνυμα, παρακαλώ πατήστε εδώ: ${replyLink}`;
    }
    
    console.log("Sending email with Resend...");
    const sendResult = await resend.emails.send({
      from: `Eggrafo Support <${fromEmail}>`,
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${message.replace(/\n/g, "<br />")}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;" />
          <p><strong>Support Team - Eggrafo.work</strong></p>
          ${replyLink ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0; color: #666;">Για να απαντήσετε στο μήνυμα:</p>
            <a href="${replyLink}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Πατήστε Εδώ</a>
          </div>
          ` : ''}
        </div>
      `,
      attachments: attachments.length ? attachments : undefined,
    });

    console.log("Resend response:", sendResult);

    if (sendResult.error) {
      console.error("Resend error:", sendResult.error);
      return new Response(JSON.stringify({ 
        error: `Email sending failed: ${sendResult.error.message || sendResult.error}` 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Save admin replies to database using service role key
    if (isAdminReply && chatId) {
      console.log("Saving admin reply to database...");
      const supabaseServiceRole = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: dbError } = await supabaseServiceRole
        .from("chatbot_replies")
        .insert({
          chatbot_message_id: chatId,
          email: email,
          subject: subject,
          body: message,
          file_url: null,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        // Don't fail the entire request if database save fails
      } else {
        console.log("Admin reply saved to database successfully");
      }
    }

    console.log("Email sent successfully:", sendResult.data?.id);
    return new Response(JSON.stringify({ 
      success: true, 
      id: sendResult.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-chatbot-reply error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown server error";
    return new Response(
      JSON.stringify({ error: `Server error: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

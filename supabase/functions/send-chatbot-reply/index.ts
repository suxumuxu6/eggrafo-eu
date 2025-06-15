
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    console.log("Parsed data:", { email, subject, messageLength: message?.length, hasFile: !!file });

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
    // Replace "gemhdesk@gmail.com" with your verified domain email
    const fromEmail = Deno.env.get("FROM_EMAIL") || "gemhdesk@gmail.com";
    
    console.log("Sending email with Resend...");
    const sendResult = await resend.emails.send({
      from: `Eggrafo Support <${fromEmail}>`,
      to: [email],
      subject,
      html: `<p>${message.replace(/\n/g, "<br />")}</p>`,
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

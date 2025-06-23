
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { checkRateLimit, validateRequest } from './utils.ts';
import { generateEmailTemplate } from './templates.ts';
import type { NotificationRequest } from './types.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req: Request) => {
  console.log("🚀 Received request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  // Rate limiting
  if (!checkRateLimit(req)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { 
      status: 429, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const requestBody = await req.json() as NotificationRequest;
    const { type, email, ticketCode, chatId } = requestBody;
    
    console.log("📧 Processing notification:", { type, email: email?.substring(0, 5) + "***", ticketCode, chatId });

    // Check if Resend API key is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not found in environment variables");
      return new Response(JSON.stringify({ 
        error: "Email service not configured. Please set RESEND_API_KEY." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate required fields
    const validationError = validateRequest(requestBody);
    if (validationError) {
      console.error("❌ Validation error:", validationError);
      throw new Error(validationError);
    }

    // Generate email template
    const emailData = generateEmailTemplate(requestBody);

    console.log("📤 Sending email via Resend to:", emailData.to);
    
    // Use verified domain
    const fromEmail = "Eggrafo Support <support@eggrafo.work>";
    
    const sendResult = await resend.emails.send({
      from: fromEmail,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log("📊 Resend API response:", sendResult);

    if (sendResult.error) {
      console.error("❌ Resend API error:", sendResult.error);
      return new Response(JSON.stringify({ 
        error: `Email sending failed: ${sendResult.error.message}`,
        details: sendResult.error
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

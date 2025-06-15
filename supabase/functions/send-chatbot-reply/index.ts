
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();

    const email = formData.get("email")?.toString();
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString();
    const file = formData.get("file") as File | undefined;

    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const attachments: any[] = [];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      attachments.push({
        filename: file.name,
        content: Buffer.from(arrayBuffer),
        contentType: file.type || "application/pdf",
      });
    }

    const sendResult = await resend.emails.send({
      from: "Eggrafo Chatbot <onboarding@resend.dev>",
      to: [email],
      subject,
      html: `<p>${message.replace(/\n/g, "<br />")}</p>`,
      attachments: attachments.length ? attachments : undefined,
    });

    if (sendResult.error) {
      return new Response(JSON.stringify({ error: sendResult.error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-chatbot-reply error:", e);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

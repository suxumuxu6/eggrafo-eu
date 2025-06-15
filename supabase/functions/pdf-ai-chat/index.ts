
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert assistant for PDF documents with particular knowledge for company registry (ΓΕΜΗ) requirements in Greece. If the user asks for an example document for ΓΕΜΗ or wants a different example, answer and ask for details about the type of document required. Always guide them on how to prepare or structure PDFs for Greek public registries. If their request is outside your expertise, politely inform them.",
          },
          { role: "user", content: message },
        ],
        max_tokens: 400,
      }),
    });
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Δεν μπορώ να απαντήσω αυτή τη στιγμή. Παρακαλώ προσπαθήστε ξανά!";

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


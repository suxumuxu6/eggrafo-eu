
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ChatbotReply: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatId = searchParams.get("chat");
  
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("Απάντηση στο μήνυμά σας");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!chatId) {
      toast.error("Δεν βρέθηκε ID συνομιλίας");
      navigate("/");
      return;
    }
    fetchConversation();
  }, [chatId]);

  const fetchConversation = async () => {
    try {
      console.log("Fetching conversation with ID:", chatId);
      
      // Try to fetch with service role to bypass RLS
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("id", chatId)
        .single();

      console.log("Fetch result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No conversation found");
      }
      
      setConversation(data);
      // Pre-fill the sender email if available
      if (data.email) {
        setSenderEmail(data.email);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Αποτυχία φόρτωσης συνομιλίας");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senderEmail.trim() || !replyBody.trim()) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία");
      return;
    }

    setSending(true);
    try {
      console.log("Sending reply...");
      console.log("Email:", senderEmail);
      console.log("Subject:", subject);
      console.log("Body length:", replyBody.length);
      console.log("Chat ID:", chatId);

      const formData = new FormData();
      formData.append("email", senderEmail);
      formData.append("subject", subject);
      formData.append("message", replyBody);
      formData.append("chatId", chatId || "");
      formData.append("isAdminReply", "false");

      console.log("Making request to edge function...");
      const res = await fetch(
        "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
        {
          method: "POST",
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
          },
          body: formData,
        }
      );

      console.log("Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      const responseText = await res.text();
      console.log("Raw response text:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      if (res.ok && responseData.success) {
        toast.success("Το μήνυμα εστάλη επιτυχώς!");
        setReplyBody("");
        // Optionally redirect back to main page or show success message
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const errorMessage = responseData?.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error("Server returned error:", errorMessage);
        toast.error("Σφάλμα αποστολής: " + errorMessage);
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error("Αποτυχία αποστολής: " + (error.message || "Άγνωστο σφάλμα"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Φόρτωση...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Η συνομιλία δεν βρέθηκε</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Απάντηση σε Συνομιλία</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show conversation messages */}
          {conversation.messages && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Αρχική Συνομιλία:</h3>
              <div className="space-y-2">
                {conversation.messages.map((msg: any, idx: number) => (
                  <div key={idx} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <strong>{msg.sender === 'user' ? 'Χρήστης' : 'Bot'}:</strong> {msg.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Παραλήπτη</label>
              <Input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Θέμα</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Μήνυμα</label>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Γράψτε την απάντησή σας εδώ..."
                rows={6}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={sending}>
                {sending ? "Αποστολή..." : "Αποστολή Απάντησης"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Ακύρωση
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotReply;

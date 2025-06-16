
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ChatbotReply: React.FC = () => {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chat");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [conversation, setConversation] = useState<any>(null);

  useEffect(() => {
    if (chatId) {
      fetchConversation();
    }
  }, [chatId]);

  const fetchConversation = async () => {
    if (!chatId) return;
    
    const { data, error } = await supabase
      .from("chatbot_messages")
      .select("*")
      .eq("id", chatId)
      .single();

    if (!error && data) {
      setConversation(data);
      if (data.email) {
        setEmail(data.email);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Insert the user reply into chatbot_replies table
      const { error } = await supabase
        .from("chatbot_replies")
        .insert({
          chatbot_message_id: chatId,
          email: email,
          subject: "User Reply",
          body: message,
          file_url: null,
        });

      if (error) {
        console.error("Error saving reply:", error);
        toast.error("Failed to send reply");
      } else {
        setSubmitted(true);
        toast.success("Your reply has been sent successfully!");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Invalid Link</h1>
            <p className="text-gray-600">This reply link is not valid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-green-600 mb-2">Reply Sent!</h1>
            <p className="text-gray-600">Thank you for your reply. Our team will review it shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Reply to Eggrafo.work Support</CardTitle>
          <p className="text-sm text-gray-600">
            Use this form to reply to our support team regarding your chatbot conversation.
          </p>
        </CardHeader>
        <CardContent>
          {conversation && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Original Conversation:</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Date:</strong> {new Date(conversation.submitted_at).toLocaleString()}</p>
                <p><strong>Messages:</strong> {conversation.messages?.length || 0} messages</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={!!conversation?.email}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Reply</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reply"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotReply;

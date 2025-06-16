
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
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία");
      return;
    }

    setLoading(true);
    try {
      // Insert the user reply directly using the service role or without RLS restrictions
      const { error } = await supabase
        .from("chatbot_replies")
        .insert({
          chatbot_message_id: chatId,
          email: email,
          subject: "Απάντηση Χρήστη",
          body: message,
          file_url: null,
        });

      if (error) {
        console.error("Error saving reply:", error);
        toast.error("Αποτυχία αποστολής απάντησης");
      } else {
        setSubmitted(true);
        toast.success("Η απάντησή σας στάλθηκε επιτυχώς!");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Αποτυχία αποστολής απάντησης");
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Μη έγκυρος Σύνδεσμος</h1>
            <p className="text-gray-600">Αυτός ο σύνδεσμος απάντησης δεν είναι έγκυρος ή έχει λήξει.</p>
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
            <h1 className="text-xl font-semibold text-green-600 mb-2">Η Απάντηση Στάλθηκε!</h1>
            <p className="text-gray-600">Ευχαριστούμε για την απάντησή σας. Η ομάδα μας θα την εξετάσει σύντομα.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Απάντηση στην Υποστήριξη Eggrafo.work</CardTitle>
          <p className="text-sm text-gray-600">
            Χρησιμοποιήστε αυτή τη φόρμα για να απαντήσετε στην ομάδα υποστήριξής μας σχετικά με τη συνομιλία σας με το chatbot.
          </p>
        </CardHeader>
        <CardContent>
          {conversation && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Αρχική Συνομιλία:</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Ημερομηνία:</strong> {new Date(conversation.submitted_at).toLocaleString('el-GR')}</p>
                <p><strong>Μηνύματα:</strong> {conversation.messages?.length || 0} μηνύματα</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Το Email σας</label>
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
              <label className="block text-sm font-medium mb-1">Η Απάντησή σας</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Γράψτε την απάντησή σας εδώ..."
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Αποστολή..." : "Αποστολή Απάντησης"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotReply;

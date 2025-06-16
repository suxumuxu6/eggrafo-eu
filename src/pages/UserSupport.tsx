
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  imageUrl?: string;
}

interface SupportReply {
  id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
}

interface ChatbotMessage {
  id: string;
  email: string;
  messages: ChatMessage[];
  support_ticket_code: string;
  ticket_status: string;
  submitted_at: string;
}

const UserSupport: React.FC = () => {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversation, setConversation] = useState<ChatbotMessage | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("email", email.trim())
        .eq("support_ticket_code", accessCode.trim())
        .eq("ticket_status", "active")
        .single();

      if (error || !data) {
        toast.error("Δεν βρέθηκε ενεργό αίτημα με αυτά τα στοιχεία");
        return;
      }

      setConversation(data);
      setIsAuthenticated(true);
      await fetchReplies(data.id);
      toast.success("Επιτυχής σύνδεση!");
    } catch (error) {
      console.error("Error authenticating:", error);
      toast.error("Σφάλμα κατά τη σύνδεση");
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_replies")
        .select("*")
        .eq("chatbot_message_id", chatId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setReplies(data);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("support_replies")
        .insert({
          chatbot_message_id: conversation.id,
          sender: "user",
          message: newMessage.trim()
        });

      if (error) throw error;

      toast.success("Η απάντησή σας στάλθηκε επιτυχώς!");
      setNewMessage("");
      await fetchReplies(conversation.id);
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("Σφάλμα κατά την αποστολή της απάντησης");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setConversation(null);
    setReplies([]);
    setEmail("");
    setAccessCode("");
    setNewMessage("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Πρόσβαση Υποστήριξης</CardTitle>
              <p className="text-sm text-gray-600 text-center">
                Εισάγετε το email και τον κωδικό πρόσβασης που λάβατε από το chatbot
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Το email σας"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Κωδικός Πρόσβασης</label>
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="π.χ. ABC123XY"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Σύνδεση..." : "Είσοδος"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Αίτημα Υποστήριξης</h1>
            <p className="text-gray-600">Κωδικός: {conversation?.support_ticket_code}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Αποσύνδεση
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Αρχική Συνομιλία</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversation?.messages?.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                    <div className="font-medium text-sm text-gray-600">
                      {msg.sender === 'user' ? 'Εσείς' : 'Bot'}
                    </div>
                    <div className="mt-1 whitespace-pre-line">{msg.text}</div>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Attached" className="mt-2 max-w-full rounded" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Συνομιλία Υποστήριξης</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {replies.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Δεν υπάρχουν ακόμα απαντήσεις. Στείλτε ένα μήνυμα παρακάτω.
                  </p>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className={`p-3 rounded-lg ${reply.sender === 'user' ? 'bg-blue-50 ml-4' : 'bg-green-50 mr-4'}`}>
                      <div className="font-medium text-sm text-gray-600">
                        {reply.sender === 'user' ? 'Εσείς' : 'Υποστήριξη'}
                      </div>
                      <div className="mt-1 whitespace-pre-line">{reply.message}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(reply.created_at).toLocaleString('el-GR')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitReply} className="space-y-3">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Γράψτε την απάντησή σας..."
                  rows={3}
                  required
                />
                <Button type="submit" disabled={submitting || !newMessage.trim()}>
                  {submitting ? "Αποστολή..." : "Αποστολή Απάντησης"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserSupport;

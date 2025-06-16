
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserSupportFileUpload from "@/components/support/UserSupportFileUpload";

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
  file_url?: string;
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
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting to find ticket with:", { email: email.trim(), code: accessCode.trim() });
      
      const { data: rawData, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("email", email.trim())
        .eq("support_ticket_code", accessCode.trim())
        .single();

      console.log("Query result:", { data: rawData, error });

      if (error || !rawData) {
        console.error("Error finding ticket:", error);
        toast.error("Δεν βρέθηκε αίτημα με αυτά τα στοιχεία. Παρακαλώ ελέγξτε το email και τον κωδικό.");
        return;
      }

      // Check if ticket is closed
      if (rawData.ticket_status === 'closed') {
        toast.error("Αυτό το αίτημα έχει κλείσει και δεν μπορείτε να προσθέσετε νέες απαντήσεις.");
        return;
      }

      // Safely transform the data to match our interface
      const transformedData: ChatbotMessage = {
        id: rawData.id,
        email: rawData.email || '',
        messages: Array.isArray(rawData.messages) 
          ? (rawData.messages as unknown as ChatMessage[])
          : [],
        support_ticket_code: rawData.support_ticket_code || '',
        ticket_status: rawData.ticket_status || '',
        submitted_at: rawData.submitted_at || ''
      };

      setConversation(transformedData);
      setIsAuthenticated(true);
      await fetchReplies(transformedData.id);
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
      const { data: rawData, error } = await supabase
        .from("support_replies")
        .select("*")
        .eq("chatbot_message_id", chatId)
        .order("created_at", { ascending: true });

      if (!error && rawData) {
        // Transform the data to match our interface
        const transformedReplies: SupportReply[] = rawData.map(reply => ({
          id: reply.id,
          sender: reply.sender as "user" | "admin",
          message: reply.message,
          created_at: reply.created_at,
          file_url: reply.file_url
        }));
        setReplies(transformedReplies);
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
      // First, upload file if present
      let fileUrl = null;
      if (replyFile) {
        const fileExt = replyFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `support-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, replyFile);

        if (uploadError) {
          toast.error("Σφάλμα κατά την ανέβασμα του αρχείου");
          return;
        }

        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

        if (urlData?.signedUrl) {
          fileUrl = urlData.signedUrl;
        }
      }

      const { error } = await supabase
        .from("support_replies")
        .insert({
          chatbot_message_id: conversation.id,
          sender: "user",
          message: newMessage.trim(),
          file_url: fileUrl
        });

      if (error) throw error;

      toast.success("Η απάντησή σας στάλθηκε επιτυχώς!");
      setNewMessage("");
      setReplyFile(null);
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
            <p className="text-sm text-gray-500">
              Κατάσταση: {conversation?.ticket_status === 'closed' ? 'Κλεισμένο' : 'Ενεργό'}
            </p>
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
                      {reply.file_url && (
                        <div className="mt-2">
                          <a
                            href={reply.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            📎 Προβολή συνημμένου αρχείου
                          </a>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(reply.created_at).toLocaleString('el-GR')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {conversation?.ticket_status !== 'closed' && (
                <form onSubmit={handleSubmitReply} className="space-y-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Γράψτε την απάντησή σας..."
                    rows={3}
                    required
                  />
                  <UserSupportFileUpload
                    file={replyFile}
                    onFileSelect={setReplyFile}
                    disabled={submitting}
                  />
                  <Button type="submit" disabled={submitting || !newMessage.trim()}>
                    {submitting ? "Αποστολή..." : "Αποστολή Απάντησης"}
                  </Button>
                </form>
              )}

              {conversation?.ticket_status === 'closed' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Αυτό το αίτημα έχει κλείσει. Δεν μπορείτε να προσθέσετε νέες απαντήσεις.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserSupport;

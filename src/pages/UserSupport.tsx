
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import UserSupportFileUpload from "@/components/support/UserSupportFileUpload";
import { sendEmailViaApi } from "@/utils/emailApi";

interface ChatMessage {
  sender: "bot" | "user" | "admin";
  text: string;
  imageUrl?: string;
}

interface SupportReply {
  id: string;
  message: string;
  sender: "user" | "admin";
  created_at: string;
  file_url?: string;
}

const UserSupport: React.FC = () => {
  const [email, setEmail] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationFound, setConversationFound] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSearch = async () => {
    if (!email.trim() || !ticketCode.trim()) {
      toast.error("Παρακαλώ εισάγετε το email και τον κωδικό.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("email", email.trim())
        .eq("support_ticket_code", ticketCode.trim())
        .single();

      if (error || !data) {
        toast.error("Δεν βρέθηκε συνομιλία με αυτά τα στοιχεία.");
        setConversationFound(false);
        return;
      }

      // Safely cast messages with proper type checking
      const rawMessages = data.messages;
      let messages: ChatMessage[] = [];
      
      if (Array.isArray(rawMessages)) {
        messages = rawMessages
          .filter((msg: any) => 
            msg && 
            typeof msg === 'object' && 
            typeof msg.sender === 'string' && 
            typeof msg.text === 'string'
          )
          .map((msg: any) => ({
            sender: msg.sender as "bot" | "user" | "admin",
            text: msg.text,
            ...(msg.imageUrl && { imageUrl: msg.imageUrl })
          }));
      }
      
      setConversation(messages);
      setChatId(data.id);
      setConversationFound(true);
      
      // Fetch replies with proper type casting
      const { data: repliesData, error: repliesError } = await supabase
        .from("support_replies")
        .select("*")
        .eq("chatbot_message_id", data.id)
        .order("created_at", { ascending: true });

      if (!repliesError && repliesData) {
        // Transform and type-cast the replies data
        const typedReplies: SupportReply[] = repliesData.map(reply => ({
          id: reply.id,
          message: reply.message,
          sender: reply.sender as "user" | "admin",
          created_at: reply.created_at,
          file_url: reply.file_url
        }));
        setReplies(typedReplies);
      }

      toast.success("Συνομιλία βρέθηκε!");
    } catch (error) {
      console.error("Error searching conversation:", error);
      toast.error("Σφάλμα κατά την αναζήτηση.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !chatId) {
      toast.error("Παρακαλώ εισάγετε ένα μήνυμα.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_replies")
        .insert({
          chatbot_message_id: chatId,
          sender: "user",
          message: newReply.trim()
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        toast.error("Σφάλμα αποστολής μηνύματος.");
        return;
      }

      // Type-cast the returned data
      const newReplyData: SupportReply = {
        id: data.id,
        message: data.message,
        sender: data.sender as "user" | "admin",
        created_at: data.created_at,
        file_url: data.file_url
      };

      // Add to local state
      setReplies(prev => [...prev, newReplyData]);
      
      // Send notification to admin about user reply using working email API
      console.log("Sending admin notification for user reply...");
      try {
        const adminEmailData = {
          subject: `Νέα απάντηση από χρήστη: ${ticketCode}`,
          message: `Ο χρήστης έστειλε νέα απάντηση.

Κωδικός αιτήματος: ${ticketCode}
Email χρήστη: ${email}
Χρόνος: ${new Date().toLocaleString('el-GR')}

Μήνυμα χρήστη: "${newReply.trim()}"

Μπορείτε να δείτε και να απαντήσετε στο αίτημα: https://eggrafo.work/admin-chatbot`
        };
        
        await sendEmailViaApi("dldigiweb@gmail.com", chatId, adminEmailData);
        console.log("Admin notification sent successfully");
        toast.success("Το μήνυμά σας εστάλη και ο διαχειριστής ειδοποιήθηκε!");
      } catch (notificationError) {
        console.error("Failed to send admin notification:", notificationError);
        toast.success("Το μήνυμά σας εστάλη!");
      }
      
      setNewReply("");
      setUploadedFile(null);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Σφάλμα αποστολής μηνύματος.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Υποστήριξη Χρηστών</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Εισάγετε το email σας"
              />
            </div>
            <div>
              <Label htmlFor="ticketCode">Κωδικός Αιτήματος</Label>
              <Input
                id="ticketCode"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                placeholder="Εισάγετε τον κωδικό"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Αναζήτηση..." : "Αναζήτηση Συνομιλίας"}
          </Button>

          {conversationFound && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Αρχική Συνομιλία</h3>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                {conversation.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block p-2 rounded-lg max-w-xs ${
                      msg.sender === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-white border"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Attachment" className="mt-2 max-w-full rounded" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold">Απαντήσεις</h3>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                {replies.length === 0 ? (
                  <p className="text-gray-500 text-center">Δεν υπάρχουν απαντήσεις ακόμα.</p>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className={`mb-3 ${reply.sender === "user" ? "text-right" : "text-left"}`}>
                      <div className={`inline-block p-3 rounded-lg max-w-xs ${
                        reply.sender === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-green-500 text-white"
                      }`}>
                        <p className="text-sm">{reply.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {reply.sender === "admin" ? "Διαχειριστής" : "Εσείς"} - {new Date(reply.created_at).toLocaleString('el-GR')}
                        </p>
                        {reply.file_url && (
                          <a href={reply.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                            Αρχείο συνημμένο
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="newReply">Νέα Απάντηση</Label>
                <Textarea
                  id="newReply"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Γράψτε την απάντησή σας..."
                  rows={4}
                />
                
                <UserSupportFileUpload onFileSelect={setUploadedFile} />
                
                <Button 
                  onClick={handleSendReply} 
                  disabled={isLoading || !newReply.trim()}
                  className="w-full"
                >
                  {isLoading ? "Αποστολή..." : "Αποστολή Απάντησης"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSupport;

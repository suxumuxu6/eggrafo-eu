
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ChatbotConversationsTable from "@/components/admin/ChatbotConversationsTable";
import ChatbotReplyDialog from "@/components/admin/ChatbotReplyDialog";
import ChatbotDeleteDialog from "@/components/admin/ChatbotDeleteDialog";
import ChatbotMessagesModal from "@/components/admin/ChatbotMessagesModal";
import ChatbotRepliesModal from "./ChatbotRepliesModal";
import CloseTicketButton from "@/components/admin/CloseTicketButton";

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
  status: "unread" | "read";
  last_admin_reply_at: string | null;
  admin_reply_count: number;
  support_ticket_code: string | null;
  ticket_status: string | null;
}

interface ChatbotReply {
  id: string;
  email: string;
  subject: string;
  body: string;
  file_url: string | null;
  created_at: string;
}

interface SupportReply {
  id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
}

const AdminChatbot: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [supportReplies, setSupportReplies] = useState<Record<string, SupportReply[]>>({});
  
  // Reply modal state
  const [replyTo, setReplyTo] = useState<{ email: string; chatId: string } | null>(null);
  const [replySubject, setReplySubject] = useState("Απάντηση από την ομάδα eggrafo.work");
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Messages Modal state
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatbotMessage | null>(null);

  // Replies Modal state
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);
  const [modalReplies, setModalReplies] = useState<ChatbotReply[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("chatbot_messages")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setData(data as ChatbotMessage[]);
      // Fetch support replies for each conversation
      data.forEach(msg => {
        if (msg.id) fetchSupportReplies(msg.id);
      });
    }
    setLoading(false);
  }

  async function fetchSupportReplies(chatId: string) {
    const { data, error } = await supabase
      .from("support_replies")
      .select("*")
      .eq("chatbot_message_id", chatId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setSupportReplies(prev => ({
        ...prev,
        [chatId]: data as SupportReply[]
      }));
    }
  }

  const handleReplyOpen = (email: string | null, chatId: string) => {
    if (email) {
      setReplySubject("Απάντηση από την ομάδα eggrafo.work");
      setReplyBody("");
      setReplyFile(null);
      setReplyTo({ email, chatId });
    } else {
      toast.error("No email for this conversation.");
    }
  };

  const handleReplySend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo?.email) {
      toast.error("No email address specified.");
      return;
    }
    
    if (!replyBody.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setSendingReply(true);
    try {
      console.log("Sending reply to:", replyTo.email);
      console.log("Subject:", replySubject);
      console.log("Body length:", replyBody.length);
      console.log("Chat ID:", replyTo.chatId);
      
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required. Please log in again.");
        return;
      }
      
      const formData = new FormData();
      formData.append("email", replyTo.email);
      formData.append("subject", replySubject);
      formData.append("message", replyBody);
      formData.append("chatId", replyTo.chatId);
      formData.append("isAdminReply", "true");
      if (replyFile) {
        console.log("Adding file:", replyFile.name, "Size:", replyFile.size);
        formData.append("file", replyFile);
      }

      console.log("Making request to edge function...");
      const res = await fetch(
        "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
          },
          body: formData,
        }
      );
      
      console.log("Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      const responseText = await res.text();
      console.log("Raw response text:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        console.error("Response was:", responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      if (res.ok && responseData.success) {
        console.log("Success! Email sent with ID:", responseData.id);
        toast.success("Απάντηση εστάλη επιτυχώς.");
        
        // Save admin reply to support_replies table
        await supabase
          .from("support_replies")
          .insert({
            chatbot_message_id: replyTo.chatId,
            sender: "admin",
            message: replyBody
          });
        
        // Update database to mark as read and increment reply count
        const currentMsg = data.find(msg => msg.id === replyTo.chatId);
        const newReplyCount = (currentMsg?.admin_reply_count || 0) + 1;
        
        await supabase
          .from("chatbot_messages")
          .update({
            status: "read",
            admin_reply_count: newReplyCount,
            last_admin_reply_at: new Date().toISOString(),
          })
          .eq("id", replyTo.chatId);
          
        fetchMessages();
        fetchSupportReplies(replyTo.chatId);
        setReplyTo(null);
      } else {
        const errorMessage = responseData?.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error("Server returned error:", errorMessage);
        console.error("Full response:", responseData);
        toast.error("Σφάλμα αποστολής: " + errorMessage);
      }
    } catch (err: any) {
      console.error("Fetch/Network error:", err);
      console.error("Error type:", typeof err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      let userFriendlyMessage = "Network error";
      if (err.message) {
        if (err.message.includes("JSON")) {
          userFriendlyMessage = "Server returned invalid response";
        } else if (err.message.includes("fetch")) {
          userFriendlyMessage = "Connection failed";
        } else {
          userFriendlyMessage = err.message;
        }
      }
      
      toast.error("Αποτυχία αποστολής: " + userFriendlyMessage);
    } finally {
      setSendingReply(false);
      setReplyFile(null);
      setReplyBody("");
      setReplySubject("Απάντηση από την ομάδα eggrafo.work");
    }
  };

  // Fetch replies for a chat
  async function openRepliesModal(chatId: string) {
    setRepliesModalOpen(true);
    setCurrentChatId(chatId);
    const { data, error } = await supabase
      .from("chatbot_replies")
      .select("*")
      .eq("chatbot_message_id", chatId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setModalReplies(data as ChatbotReply[]);
    } else {
      setModalReplies([]);
    }
  }

  const handleDeleteConversation = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("chatbot_messages").delete().eq("id", id);
      if (!error) {
        toast.success("Συνομιλία διαγράφηκε.");
        setConfirmDeleteId(null);
        fetchMessages();
      } else {
        toast.error("Αποτυχία διαγραφής.");
      }
    } catch {
      toast.error("Αποτυχία διαγραφής.");
    }
    setDeleting(false);
  };

  const handleShowMessages = (conversation: ChatbotMessage) => {
    setSelectedConversation(conversation);
    setMessagesModalOpen(true);
  };

  const handleTicketClosed = () => {
    fetchMessages();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">Admin access only</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Reply Dialog */}
      <ChatbotReplyDialog
        open={!!replyTo}
        onOpenChange={open => !open && setReplyTo(null)}
        replyTo={replyTo}
        replySubject={replySubject}
        setReplySubject={setReplySubject}
        replyBody={replyBody}
        setReplyBody={setReplyBody}
        replyFile={replyFile}
        setReplyFile={setReplyFile}
        sendingReply={sendingReply}
        onSubmit={handleReplySend}
      />

      {/* Messages Modal */}
      <ChatbotMessagesModal
        open={messagesModalOpen}
        onOpenChange={setMessagesModalOpen}
        conversation={selectedConversation}
        onConversationUpdate={fetchMessages}
      />

      {/* Replies Modal */}
      <ChatbotRepliesModal
        open={repliesModalOpen}
        onOpenChange={setRepliesModalOpen}
        replies={modalReplies}
      />

      {/* Delete Confirmation Dialog */}
      <ChatbotDeleteDialog
        open={!!confirmDeleteId}
        onOpenChange={open => !open && setConfirmDeleteId(null)}
        deleting={deleting}
        onConfirm={() => handleDeleteConversation(confirmDeleteId!)}
      />

      <Card className="bg-slate-50 border border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle>Chatbot Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex justify-center items-center py-24">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No chatbot submissions found.</div>
          ) : (
            <div className="space-y-4">
              {data.map((conversation) => (
                <div key={conversation.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          conversation.ticket_status === 'closed' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {conversation.ticket_status === 'closed' ? 'Κλεισμένο' : 'Ενεργό'}
                        </span>
                        {conversation.support_ticket_code && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-mono">
                            {conversation.support_ticket_code}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Email: {conversation.email || "Χωρίς email"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(conversation.submitted_at).toLocaleString('el-GR')}
                      </p>
                      {supportReplies[conversation.id]?.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {supportReplies[conversation.id].length} απαντήσεις υποστήριξης
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowMessages(conversation)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Προβολή
                      </button>
                      {conversation.email && (
                        <button
                          onClick={() => handleReplyOpen(conversation.email, conversation.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Απάντηση
                        </button>
                      )}
                      {conversation.ticket_status === 'active' && conversation.email && conversation.support_ticket_code && (
                        <CloseTicketButton
                          chatId={conversation.id}
                          email={conversation.email}
                          ticketCode={conversation.support_ticket_code}
                          onTicketClosed={handleTicketClosed}
                        />
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(conversation.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Διαγραφή
                      </button>
                    </div>
                  </div>

                  {/* Support Replies Section */}
                  {supportReplies[conversation.id]?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Συνομιλία Υποστήριξης:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {supportReplies[conversation.id].map((reply) => (
                          <div key={reply.id} className={`p-2 rounded text-sm ${
                            reply.sender === 'user' 
                              ? 'bg-blue-50 border-l-2 border-blue-400 ml-4' 
                              : 'bg-green-50 border-l-2 border-green-400 mr-4'
                          }`}>
                            <div className="font-medium text-xs text-gray-600 mb-1">
                              {reply.sender === 'user' ? 'Χρήστης' : 'Admin'}
                              <span className="ml-2 font-normal">
                                {new Date(reply.created_at).toLocaleString('el-GR')}
                              </span>
                            </div>
                            <div className="whitespace-pre-line">{reply.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatbot;

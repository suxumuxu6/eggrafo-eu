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

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
  status: "unread" | "read";
  last_admin_reply_at: string | null;
  admin_reply_count: number;
}

interface ChatbotReply {
  id: string;
  email: string;
  subject: string;
  body: string;
  file_url: string | null;
  created_at: string;
}

const AdminChatbot: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Reply modal state
  const [replyTo, setReplyTo] = useState<{ email: string; chatId: string } | null>(null);
  const [replySubject, setReplySubject] = useState("Απάντηση από την ομάδα eggrafo.eu");
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

    if (!error && data) setData(data as ChatbotMessage[]);
    setLoading(false);
  }

  const handleReplyOpen = (email: string | null, chatId: string) => {
    if (email) {
      setReplySubject("Απάντηση από την ομάδα eggrafo.eu");
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
      const formData = new FormData();
      formData.append("email", replyTo.email);
      formData.append("subject", replySubject);
      formData.append("message", replyBody);
      if (replyFile) formData.append("file", replyFile);

      const res = await fetch(
        "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
        {
          method: "POST",
          body: formData,
        }
      );
      
      const responseText = await res.text();
      console.log("Response status:", res.status);
      console.log("Response text:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (res.ok && responseData.success) {
        toast.success("Απάντηση εστάλη επιτυχώς.");
        
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
          
        // Insert reply row
        let fileUrl = null;
        if (replyFile) {
          // Optionally, you can implement file uploads to storage
        }
        await supabase.from("chatbot_replies").insert({
          chatbot_message_id: replyTo.chatId,
          email: replyTo.email,
          subject: replySubject,
          body: replyBody,
          file_url: fileUrl,
        });
        
        fetchMessages();
        setReplyTo(null);
      } else {
        const errorMessage = responseData?.error || "Unknown error occurred";
        console.error("Server error:", errorMessage);
        toast.error("Σφάλμα αποστολής: " + errorMessage);
      }
    } catch (err: any) {
      console.error("Network/fetch error:", err);
      toast.error("Αποτυχία αποστολής: " + (err.message || "Network error"));
    } finally {
      setSendingReply(false);
      setReplyFile(null);
      setReplyBody("");
      setReplySubject("Απάντηση από την ομάδα eggrafo.eu");
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">Admin access only</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
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
            <ChatbotConversationsTable
              data={data}
              expandedId={expandedId}
              onReplyOpen={handleReplyOpen}
              onDeleteConfirm={setConfirmDeleteId}
              onViewReplies={openRepliesModal}
              onShowMessages={handleShowMessages}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatbot;

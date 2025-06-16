
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ChatbotReplyDialog from "@/components/admin/ChatbotReplyDialog";
import ChatbotDeleteDialog from "@/components/admin/ChatbotDeleteDialog";
import ChatbotMessagesModal from "@/components/admin/ChatbotMessagesModal";
import ChatbotRepliesModal from "./ChatbotRepliesModal";
import ConversationsList from "@/components/admin/ConversationsList";
import { ChatbotMessage, ChatbotReply } from "@/types/adminChatbot";
import { useSupportReplies } from "@/hooks/useSupportReplies";
import { useEmailReply } from "@/hooks/useEmailReply";

const AdminChatbot: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [data, setData] = useState<ChatbotMessage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { supportReplies, fetchSupportReplies } = useSupportReplies();
  
  const {
    replyTo,
    setReplyTo,
    replySubject,
    setReplySubject,
    replyBody,
    setReplyBody,
    replyFile,
    setReplyFile,
    sendingReply,
    handleReplyOpen,
    handleReplySend
  } = useEmailReply();

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
    if (!loading && isAuthenticated && isAdmin) {
      fetchMessages();
    }
  }, [loading, isAuthenticated, isAdmin]);

  const fetchMessages = async () => {
    setDataLoading(true);
    try {
      console.log("Fetching chatbot messages...");
      
      const { data: rawData, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .order("submitted_at", { ascending: false });

      console.log("Fetched data:", { data: rawData, error });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Σφάλμα κατά τη φόρτωση των μηνυμάτων");
        return;
      }

      if (rawData) {
        const transformedData: ChatbotMessage[] = rawData.map(item => ({
          id: item.id,
          email: item.email || '',
          messages: Array.isArray(item.messages) ? item.messages as Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }> : [],
          submitted_at: item.submitted_at || '',
          status: (item.status as "unread" | "read") || "unread",
          last_admin_reply_at: item.last_admin_reply_at,
          admin_reply_count: item.admin_reply_count || 0,
          support_ticket_code: item.support_ticket_code || '',
          ticket_status: item.ticket_status || 'active'
        }));
        
        console.log("Transformed data:", transformedData);
        setData(transformedData);
        
        // Fetch support replies for each message
        transformedData.forEach(msg => {
          if (msg.id) fetchSupportReplies(msg.id);
        });
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast.error("Σφάλμα κατά τη φόρτωση των μηνυμάτων");
    } finally {
      setDataLoading(false);
    }
  };

  const openRepliesModal = async (chatId: string) => {
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
  };

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

  const handleReplySuccess = () => {
    fetchMessages();
    if (replyTo) {
      fetchSupportReplies(replyTo.chatId);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  // Redirect to auth if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">
        <p>Admin access only</p>
        <p className="text-sm mt-2">Please log in as an administrator to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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
        onSubmit={(e) => handleReplySend(e, handleReplySuccess)}
      />

      <ChatbotMessagesModal
        open={messagesModalOpen}
        onOpenChange={setMessagesModalOpen}
        conversation={selectedConversation}
        onConversationUpdate={fetchMessages}
      />

      <ChatbotRepliesModal
        open={repliesModalOpen}
        onOpenChange={setRepliesModalOpen}
        replies={modalReplies}
      />

      <ChatbotDeleteDialog
        open={!!confirmDeleteId}
        onOpenChange={open => !open && setConfirmDeleteId(null)}
        deleting={deleting}
        onConfirm={() => handleDeleteConversation(confirmDeleteId!)}
      />

      <Card className="bg-slate-50 border border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle>Chatbot Conversations</CardTitle>
          <div className="text-sm text-gray-600">
            Total conversations: {data.length}
          </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="w-full flex justify-center items-center py-24">Loading conversations...</div>
          ) : (
            <ConversationsList
              data={data}
              supportReplies={supportReplies}
              onShowMessages={handleShowMessages}
              onReplyOpen={handleReplyOpen}
              onDeleteConfirm={setConfirmDeleteId}
              onTicketClosed={handleTicketClosed}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatbot;

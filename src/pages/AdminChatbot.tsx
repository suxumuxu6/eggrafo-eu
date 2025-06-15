
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BadgeCheck, Trash2 } from "lucide-react";
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
  // Reply modal
  const [replyTo, setReplyTo] = useState<{ email: string; chatId: string } | null>(null);
  const [replySubject, setReplySubject] = useState("Απάντηση από την ομάδα eggrafo.eu");
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Replies Modal
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);
  const [modalReplies, setModalReplies] = useState<ChatbotReply[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, []);

  async function fetchMessages() {
    setLoading(true);
    // Also fetch status/admin_reply_count for markers
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
    setSendingReply(true);
    try {
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
      if (res.ok) {
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
      } else {
        const resp = await res.json();
        toast.error("Σφάλμα αποστολής: " + (resp?.error || "Unknown"));
      }
      setReplyTo(null);
    } catch (err: any) {
      toast.error("Αποτυχία αποστολής.");
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">Admin access only</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onOpenChange={open => !open && setReplyTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to User</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleReplySend}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email (to)</label>
              <Input type="email" value={replyTo?.email ?? ""} disabled readOnly />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <Input value={replySubject} onChange={e => setReplySubject(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message</label>
              <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} required placeholder="Γράψτε την απάντηση σας εδώ..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Attachment (PDF)</label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={e => setReplyFile(e.target.files?.[0] || null)}
                disabled={sendingReply}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReplyTo(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendingReply || !replyBody.trim()}>
                {sendingReply ? "Sending..." : "Send Reply"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Replies Modal */}
      <ChatbotRepliesModal
        open={repliesModalOpen}
        onOpenChange={setRepliesModalOpen}
        replies={modalReplies}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={open => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Διαγραφή συνομιλίας;</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-muted-foreground">Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή τη συνομιλία; Δεν υπάρχει τρόπος επαναφοράς.</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Άκυρο</Button>
            </DialogClose>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => handleDeleteConversation(confirmDeleteId!)}>
              {deleting ? "Παρακαλώ περιμένετε..." : "Διαγραφή"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Replies</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <TableRow className={`rounded-lg border ${msg.status === "unread" ? "bg-blue-50" : "bg-white"}`}>
                      <TableCell>
                        {msg.email || <span className="text-gray-400">None</span>}
                        {msg.status === "unread" && (
                          <span className="ml-2 text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full font-semibold">UNREAD</span>
                        )}
                        {msg.status === "read" && (
                          <span className="ml-2 text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-semibold">READ</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {msg.submitted_at
                          ? new Date(msg.submitted_at).toLocaleString()
                          : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {msg.status === "unread" ? (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Νέο</span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Διαβασμένο</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {msg.admin_reply_count > 0 ? (
                          <Button variant="outline" size="sm" onClick={() => openRepliesModal(msg.id)}>
                            <BadgeCheck className="w-4 h-4 mr-1 text-green-600" />
                            {msg.admin_reply_count} Reply{msg.admin_reply_count > 1 ? "ies" : ""}
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-xs">No Reply</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {msg.email && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReplyOpen(msg.email!, msg.id)}
                          >
                            Reply
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" title="Delete" onClick={() => setConfirmDeleteId(msg.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          {msg.admin_reply_count > 0 && (
                            <Button variant="ghost" size="icon" title="View Replies" onClick={() => openRepliesModal(msg.id)}>
                              <BadgeCheck className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === msg.id && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="space-y-1">
                            {msg.messages.map((m, i) => (
                              <div key={i}>
                                <span className="font-semibold">{m.sender === "user" ? "User" : "Bot"}:</span>{" "}
                                <span>
                                  {m.text}
                                  {m.imageUrl && (
                                    <div className='mt-1'>
                                      <img
                                        src={m.imageUrl}
                                        alt="user upload"
                                        className="max-w-[160px] border rounded shadow"
                                        style={{ display: "block", marginTop: 4 }}
                                      />
                                    </div>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminChatbot;

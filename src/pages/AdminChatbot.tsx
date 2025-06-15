import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
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

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (!error && data) setData(data as ChatbotMessage[]);
      setLoading(false);
    }
    fetchMessages();
  }, []);

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

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">Admin access only</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
      <Card>
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
                  <TableHead>Messages</TableHead>
                  <TableHead>Reply</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <TableRow>
                      <TableCell>{msg.email || <span className="text-gray-400">None</span>}</TableCell>
                      <TableCell>
                        {msg.submitted_at
                          ? new Date(msg.submitted_at).toLocaleString()
                          : ""}
                      </TableCell>
                      <TableCell>
                        <button
                          className="underline text-blue-600"
                          onClick={() =>
                            setExpandedId(expandedId === msg.id ? null : msg.id)
                          }
                        >
                          {expandedId === msg.id ? "Hide" : "Show"}
                        </button>
                      </TableCell>
                      <TableCell>
                        {msg.email && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReplyOpen(msg.email, msg.id)}
                          >
                            Reply
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === msg.id && (
                      <TableRow>
                        <TableCell colSpan={4}>
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

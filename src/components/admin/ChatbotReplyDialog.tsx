
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChatbotReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo: { email: string; chatId: string } | null;
  replySubject: string;
  setReplySubject: (subject: string) => void;
  replyBody: string;
  setReplyBody: (body: string) => void;
  replyFile: File | null;
  setReplyFile: (file: File | null) => void;
  sendingReply: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const ChatbotReplyDialog: React.FC<ChatbotReplyDialogProps> = ({
  open,
  onOpenChange,
  replyTo,
  replySubject,
  setReplySubject,
  replyBody,
  setReplyBody,
  replyFile,
  setReplyFile,
  sendingReply,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to User</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendingReply || !replyBody.trim()}>
              {sendingReply ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotReplyDialog;


import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatbotReply {
  id: string;
  email: string;
  subject: string;
  body: string;
  file_url: string | null;
  created_at: string;
}

interface ChatbotRepliesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replies: ChatbotReply[];
}

const ChatbotRepliesModal: React.FC<ChatbotRepliesModalProps> = ({ open, onOpenChange, replies }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Απαντήσεις Διαχειριστή</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {replies.length === 0 && <div className="text-gray-400 text-center">Δεν υπάρχουν απαντήσεις.</div>}
        {replies.map(r => (
          <div key={r.id} className="border rounded p-3 bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <span className="text-sm font-medium">{r.subject}</span>
              <span className="ml-2 text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="text-sm mt-2 whitespace-pre-line">{r.body}</div>
            {r.file_url && (
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-600 hover:underline text-sm"
              >
                Προβολή συνημμένου αρχείου
              </a>
            )}
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Κλείσιμο
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
export default ChatbotRepliesModal;

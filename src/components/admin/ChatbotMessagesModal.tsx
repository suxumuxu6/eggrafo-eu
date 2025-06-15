
import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
  status: "unread" | "read";
  last_admin_reply_at: string | null;
  admin_reply_count: number;
}

interface ChatbotMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ChatbotMessage | null;
  onConversationUpdate: () => void;
}

const ChatbotMessagesModal: React.FC<ChatbotMessagesModalProps> = ({
  open,
  onOpenChange,
  conversation,
  onConversationUpdate,
}) => {
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    const markAsRead = async () => {
      if (open && conversation && conversation.status === "unread" && !hasMarkedAsRead.current) {
        hasMarkedAsRead.current = true;
        try {
          console.log("Marking conversation as read:", conversation.id);
          const { error } = await supabase
            .from("chatbot_messages")
            .update({ status: "read" })
            .eq("id", conversation.id);

          if (!error) {
            onConversationUpdate();
          } else {
            console.error("Error marking conversation as read:", error);
          }
        } catch (err) {
          console.error("Error marking conversation as read:", err);
        }
      }
    };

    if (open) {
      hasMarkedAsRead.current = false;
      markAsRead();
    }
  }, [open, conversation?.id, conversation?.status, onConversationUpdate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conversation Messages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {conversation && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {conversation.email || "No email provided"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Submitted:</span> {new Date(conversation.submitted_at).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    conversation.status === "unread" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>
                    {conversation.status === "unread" ? "Unread" : "Read"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {conversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-gray-50 border-l-4 border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {message.sender === "user" ? "User" : "Bot"}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                    {message.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={message.imageUrl}
                          alt="User upload"
                          className="max-w-xs border rounded shadow"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotMessagesModal;

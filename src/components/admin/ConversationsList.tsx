
import React from "react";
import { ChatbotMessage, SupportReply } from "@/types/adminChatbot";
import ConversationItem from "./ConversationItem";

interface ConversationsListProps {
  data: ChatbotMessage[];
  supportReplies: Record<string, SupportReply[]>;
  onShowMessages: (conversation: ChatbotMessage) => void;
  onReplyOpen: (email: string | null, chatId: string) => void;
  onDeleteConfirm: (id: string) => void;
  onTicketClosed: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  data,
  supportReplies,
  onShowMessages,
  onReplyOpen,
  onDeleteConfirm,
  onTicketClosed
}) => {
  if (data.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        No chatbot submissions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          supportReplies={supportReplies[conversation.id] || []}
          onShowMessages={onShowMessages}
          onReplyOpen={onReplyOpen}
          onDeleteConfirm={onDeleteConfirm}
          onTicketClosed={onTicketClosed}
        />
      ))}
    </div>
  );
};

export default ConversationsList;

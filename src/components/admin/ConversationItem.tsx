
import React from "react";
import { ChatbotMessage, SupportReply } from "@/types/adminChatbot";
import { Checkbox } from "@/components/ui/checkbox";
import CloseTicketButton from "./CloseTicketButton";

interface ConversationItemProps {
  conversation: ChatbotMessage;
  supportReplies: SupportReply[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onShowMessages: (conversation: ChatbotMessage) => void;
  onReplyOpen: (email: string | null, chatId: string) => void;
  onDeleteConfirm: (id: string) => void;
  onTicketClosed: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  supportReplies,
  isSelected = false,
  onSelect,
  onShowMessages,
  onReplyOpen,
  onDeleteConfirm,
  onTicketClosed
}) => {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3 flex-1">
          {onSelect && (
            <div className="mt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(conversation.id)}
              />
            </div>
          )}
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
            {supportReplies.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {supportReplies.length} απαντήσεις υποστήριξης
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onShowMessages(conversation)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Προβολή
          </button>
          {conversation.email && (
            <button
              onClick={() => onReplyOpen(conversation.email, conversation.id)}
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
              onTicketClosed={onTicketClosed}
            />
          )}
          <button
            onClick={() => onDeleteConfirm(conversation.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Διαγραφή
          </button>
        </div>
      </div>

      {/* Support Replies Section */}
      {supportReplies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Συνομιλία Υποστήριξης:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {supportReplies.map((reply) => (
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
  );
};

export default ConversationItem;

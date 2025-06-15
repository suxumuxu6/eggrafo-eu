
import React from "react";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Trash2, Eye } from "lucide-react";

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
  status: "unread" | "read";
  last_admin_reply_at: string | null;
  admin_reply_count: number;
}

interface ChatbotConversationsTableProps {
  data: ChatbotMessage[];
  expandedId: string | null;
  onReplyOpen: (email: string | null, chatId: string) => void;
  onDeleteConfirm: (id: string) => void;
  onViewReplies: (chatId: string) => void;
  onShowMessages: (conversation: ChatbotMessage) => void;
}

const ChatbotConversationsTable: React.FC<ChatbotConversationsTableProps> = ({
  data,
  expandedId,
  onReplyOpen,
  onDeleteConfirm,
  onViewReplies,
  onShowMessages,
}) => {
  return (
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
                  <Button variant="outline" size="sm" onClick={() => onViewReplies(msg.id)}>
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
                    onClick={() => onReplyOpen(msg.email!, msg.id)}
                  >
                    Reply
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Show Messages" onClick={() => onShowMessages(msg)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Delete" onClick={() => onDeleteConfirm(msg.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  {msg.admin_reply_count > 0 && (
                    <Button variant="ghost" size="icon" title="View Replies" onClick={() => onViewReplies(msg.id)}>
                      <BadgeCheck className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default ChatbotConversationsTable;

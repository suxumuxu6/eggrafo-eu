
export interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string; imageUrl?: string }>;
  submitted_at: string;
  status: "unread" | "read";
  last_admin_reply_at: string | null;
  admin_reply_count: number;
  support_ticket_code: string | null;
  ticket_status: string | null;
}

export interface ChatbotReply {
  id: string;
  email: string;
  subject: string;
  body: string;
  file_url: string | null;
  created_at: string;
}

export interface SupportReply {
  id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
  file_url?: string | null;
}

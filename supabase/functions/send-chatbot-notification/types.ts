
export interface NotificationRequest {
  type: 'new_ticket' | 'user_reply' | 'user_welcome' | 'ticket_closed';
  email: string;
  ticketCode: string;
  chatId: string;
  userMessage?: string;
}

export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
}


export interface EmailReplyState {
  email: string;
  chatId: string;
}

export interface EmailReplyData {
  subject: string;
  body: string;
  file?: File | null;
}

export interface EmailApiResponse {
  success: boolean;
  id?: string;
  error?: string;
}

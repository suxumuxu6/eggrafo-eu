
export interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  imageUrl?: string;
}

export type ChatStep = 
  | "awaitingOption" 
  | "waitingForLegalType" 
  | "waitingForDetail" 
  | "waitingForEmail" 
  | "ended" 
  | "techIssue" 
  | "techIssue_waitingForEmail" 
  | "techIssue_ended";

export const INITIAL_MESSAGE = "Γεια σας, επιλέξτε από τις παρακάτω επιλογές:";
export const OPTIONS = ["Θέλω ένα άλλο παράδειγμα εγγράφου", "Τεχνικό Θέμα με την λήψη αρχείου"];
export const LEGAL_TYPE_OPTIONS = ["ΟΕ-ΕΕ", "ΑΕ", "ΙΚΕ"];
export const MAX_IMAGE_SIZE_MB = 10;
export const STORAGE_BUCKET = "chatbot-images";

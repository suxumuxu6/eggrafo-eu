
import { useState } from "react";
import { toast } from "sonner";
import { EmailReplyState, EmailReplyData } from "@/types/emailReply";
import { sendEmailViaApi } from "@/utils/emailApi";
import { saveAdminReplyToDatabase, updateChatbotMessageStatus } from "@/utils/emailDatabase";

export const useEmailReply = () => {
  const [replyTo, setReplyTo] = useState<EmailReplyState | null>(null);
  const [replySubject, setReplySubject] = useState("Απάντηση από την ομάδα eggrafo.work");
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const handleReplyOpen = (email: string | null, chatId: string) => {
    if (email) {
      setReplySubject("Απάντηση από την ομάδα eggrafo.work");
      setReplyBody("");
      setReplyFile(null);
      setReplyTo({ email, chatId });
    } else {
      toast.error("No email for this conversation.");
    }
  };

  const resetReplyState = () => {
    setReplyFile(null);
    setReplyBody("");
    setReplySubject("Απάντηση από την ομάδα eggrafo.work");
  };

  const handleReplySend = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    
    if (!replyTo?.email) {
      toast.error("No email address specified.");
      return;
    }
    
    if (!replyBody.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setSendingReply(true);
    
    try {
      const replyData: EmailReplyData = {
        subject: replySubject,
        body: replyBody,
        file: replyFile
      };

      const responseData = await sendEmailViaApi(replyTo.email, replyTo.chatId, replyData);

      if (responseData.success) {
        toast.success("Ειδοποίηση εστάλη επιτυχώς στον χρήστη.");
        
        // Save the actual admin reply to support_replies table
        try {
          await saveAdminReplyToDatabase(replyTo.chatId, replyBody);
          await updateChatbotMessageStatus(replyTo.chatId);
        } catch (dbError) {
          console.error("Database operations failed:", dbError);
          toast.error("Το email στάλθηκε αλλά υπήρξε σφάλμα στην αποθήκευση.");
        }
        
        onSuccess();
        setReplyTo(null);
      } else {
        const errorMessage = responseData?.error || "Unknown error occurred";
        toast.error("Σφάλμα αποστολής: " + errorMessage);
      }
    } catch (err: any) {
      console.error("Email send error:", err);
      
      let userFriendlyMessage = "Network error";
      if (err.name === 'AbortError') {
        userFriendlyMessage = "Request timeout - please try again";
      } else if (err.message) {
        if (err.message.includes("JSON")) {
          userFriendlyMessage = "Server returned invalid response";
        } else if (err.message.includes("fetch")) {
          userFriendlyMessage = "Connection failed";
        } else {
          userFriendlyMessage = err.message;
        }
      }
      
      toast.error("Αποτυχία αποστολής: " + userFriendlyMessage);
    } finally {
      setSendingReply(false);
      resetReplyState();
    }
  };

  return {
    replyTo,
    setReplyTo,
    replySubject,
    setReplySubject,
    replyBody,
    setReplyBody,
    replyFile,
    setReplyFile,
    sendingReply,
    handleReplyOpen,
    handleReplySend
  };
};

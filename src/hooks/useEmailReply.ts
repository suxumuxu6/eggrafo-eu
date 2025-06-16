
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEmailReply = () => {
  const [replyTo, setReplyTo] = useState<{ email: string; chatId: string } | null>(null);
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
      console.log("Starting reply send process...");
      console.log("Sending reply to:", replyTo.email);
      console.log("Subject:", replySubject);
      console.log("Body length:", replyBody.length);
      console.log("Chat ID:", replyTo.chatId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required. Please log in again.");
        setSendingReply(false);
        return;
      }

      // Get the support ticket code for the notification
      const { data: ticketData } = await supabase
        .from("chatbot_messages")
        .select("support_ticket_code")
        .eq("id", replyTo.chatId)
        .single();

      const supportTicketCode = ticketData?.support_ticket_code;
      
      // Create simplified notification message
      const notificationMessage = `Αγαπητέ/ή χρήστη,

Έχετε λάβει νέα απάντηση για το αίτημά σας με κωδικό: ${supportTicketCode}

Για να δείτε την απάντηση και να συνεχίσετε τη συνομιλία, παρακαλώ επισκεφτείτε:
https://eggrafo.work/support

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`;
      
      const formData = new FormData();
      formData.append("email", replyTo.email);
      formData.append("subject", "Νέα απάντηση στο αίτημά σας");
      formData.append("message", notificationMessage);
      formData.append("chatId", replyTo.chatId);
      formData.append("isAdminReply", "false"); // This is just a notification, not the actual reply
      if (replyFile) {
        console.log("Adding file:", replyFile.name, "Size:", replyFile.size);
        formData.append("file", replyFile);
      }

      console.log("Making request to edge function...");
      
      // Set timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch(
        "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
          },
          body: formData,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      console.log("Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Request failed:", errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }

      const responseText = await res.text();
      console.log("Raw response text:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      if (responseData.success) {
        console.log("Success! Email sent with ID:", responseData.id);
        toast.success("Ειδοποίηση εστάλη επιτυχώς στον χρήστη.");
        
        // Save the actual admin reply to support_replies table
        const { error: replyError } = await supabase
          .from("support_replies")
          .insert({
            chatbot_message_id: replyTo.chatId,
            sender: "admin",
            message: replyBody
          });

        if (replyError) {
          console.error("Error saving reply to database:", replyError);
          toast.error("Το email στάλθηκε αλλά υπήρξε σφάλμα στην αποθήκευση.");
        }
        
        // Update the chatbot message status
        const { error: updateError } = await supabase
          .from("chatbot_messages")
          .update({
            status: "read",
            last_admin_reply_at: new Date().toISOString(),
          })
          .eq("id", replyTo.chatId);

        if (updateError) {
          console.error("Error updating message status:", updateError);
        }
          
        onSuccess();
        setReplyTo(null);
      } else {
        const errorMessage = responseData?.error || "Unknown error occurred";
        console.error("Server returned error:", errorMessage);
        toast.error("Σφάλμα αποστολής: " + errorMessage);
      }
    } catch (err: any) {
      console.error("Fetch/Network error:", err);
      
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
      setReplyFile(null);
      setReplyBody("");
      setReplySubject("Απάντηση από την ομάδα eggrafo.work");
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

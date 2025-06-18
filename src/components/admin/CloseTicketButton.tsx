
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendChatbotNotification } from "@/utils/notificationApi";

interface CloseTicketButtonProps {
  chatId: string;
  email: string | null;
  ticketCode: string | null;
  onTicketClosed: () => void;
}

const CloseTicketButton: React.FC<CloseTicketButtonProps> = ({
  chatId,
  email,
  ticketCode,
  onTicketClosed
}) => {
  const [closing, setClosing] = useState(false);

  const handleCloseTicket = async () => {
    if (!email || !ticketCode) {
      toast.error("Δεν υπάρχουν επαρκή στοιχεία για κλείσιμο του ticket");
      return;
    }

    setClosing(true);
    try {
      // Update ticket status to closed
      const { error: updateError } = await supabase
        .from("chatbot_messages")
        .update({
          ticket_status: "closed",
          closed_at: new Date().toISOString()
        })
        .eq("id", chatId);

      if (updateError) throw updateError;

      // Send closure notification email using the new notification system
      try {
        console.log("Sending ticket closure notification...");
        const notificationSuccess = await sendChatbotNotification('ticket_closed', {
          email,
          ticketCode,
          chatId
        });
        
        if (notificationSuccess) {
          console.log("Closure notification sent successfully");
        } else {
          console.warn("Failed to send closure notification");
        }
      } catch (emailError) {
        console.warn("Failed to send closure email:", emailError);
      }

      toast.success("Το ticket έκλεισε επιτυχώς");
      onTicketClosed();
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error("Σφάλμα κατά το κλείσιμο του ticket");
    } finally {
      setClosing(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCloseTicket}
      disabled={closing}
    >
      <X className="w-4 h-4 mr-1" />
      {closing ? "Κλείσιμο..." : "Κλείσιμο Ticket"}
    </Button>
  );
};

export default CloseTicketButton;

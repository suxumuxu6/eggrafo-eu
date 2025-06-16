
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      // Send closure email with updated message
      try {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("subject", "Το αίτημά σας έχει κλείσει");
        formData.append("message", "Το αίτημά σας έχει κλείσει. Μην απαντήσετε σε αυτό το email.");
        formData.append("chatId", chatId);
        formData.append("isAdminReply", "false");

        const res = await fetch(
          "https://vcxwikgasrttbngdygig.functions.supabase.co/send-chatbot-reply",
          {
            method: "POST",
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHdpa2dhc3J0dGJuZ2R5Z2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk5NTIsImV4cCI6MjA2NTM5NTk1Mn0.jB0vM1kLbBgZ256-16lypzVvyOYOah4asJN7aclrDEg'
            },
            body: formData,
          }
        );

        if (!res.ok) {
          console.warn("Failed to send closure email:", await res.text());
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

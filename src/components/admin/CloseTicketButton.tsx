
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendEmailViaApi } from "@/utils/emailApi";

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

      // Send closure notification email using the working email API
      try {
        const closureEmailData = {
          subject: `Το αίτημά σας ${ticketCode} έχει κλείσει`,
          body: `Αγαπητέ/ή χρήστη,

Tο αίτημά σας με κωδικό: ${ticketCode} έχει κλείσει και διαγράφηκε.

Με εκτίμηση,
Η ομάδα υποστήριξης eggrafo.work`,
          file: null
        };

        await sendEmailViaApi(email, chatId, closureEmailData);
        console.log("Closure notification email sent successfully");
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


import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatbotDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onConfirm: () => void;
}

const ChatbotDeleteDialog: React.FC<ChatbotDeleteDialogProps> = ({
  open,
  onOpenChange,
  deleting,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Διαγραφή συνομιλίας;</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-muted-foreground">
          Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή τη συνομιλία; Δεν υπάρχει τρόπος επαναφοράς.
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Άκυρο</Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting ? "Παρακαλώ περιμένετε..." : "Διαγραφή"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotDeleteDialog;

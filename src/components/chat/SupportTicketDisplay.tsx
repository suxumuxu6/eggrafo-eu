
import React from "react";
import { Button } from "@/components/ui/button";

interface SupportTicketDisplayProps {
  supportTicketCode: string;
  onEndChat: () => void;
}

export const SupportTicketDisplay: React.FC<SupportTicketDisplayProps> = ({
  supportTicketCode,
  onEndChat
}) => {
  return (
    <div className="flex flex-col gap-2 mt-2 items-center">
      <Button className="w-full" onClick={onEndChat} variant="secondary">
        Τέλος
      </Button>
    </div>
  );
};


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
      {supportTicketCode && (
        <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">Κωδικός Αιτήματος:</p>
          <p className="text-lg font-bold text-green-800 tracking-wider">{supportTicketCode}</p>
          <p className="text-xs text-green-600 mt-1">Κρατήστε αυτόν τον κωδικό για μελλοντική αναφορά</p>
        </div>
      )}
      <Button className="w-full" onClick={onEndChat} variant="secondary">
        Τέλος
      </Button>
    </div>
  );
};

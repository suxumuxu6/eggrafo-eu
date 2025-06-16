
import React from "react";
import { Button } from "@/components/ui/button";
import { OPTIONS, LEGAL_TYPE_OPTIONS } from "@/types/chat";

interface ChatOptionsProps {
  type: "main" | "legal";
  onOptionSelect: (option: string) => void;
}

export const ChatOptions: React.FC<ChatOptionsProps> = ({ type, onOptionSelect }) => {
  const options = type === "main" ? OPTIONS : LEGAL_TYPE_OPTIONS;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {options.map(opt => (
        <Button 
          key={opt} 
          className="w-full" 
          onClick={() => onOptionSelect(opt)} 
          variant="secondary"
        >
          {opt}
        </Button>
      ))}
    </div>
  );
};

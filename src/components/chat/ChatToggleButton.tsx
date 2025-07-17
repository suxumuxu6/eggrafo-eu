
import React from "react";
import { MessageCircle } from "lucide-react";

interface ChatToggleButtonProps {
  onClick: () => void;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-center">
      <span className="mb-1 text-xs font-medium text-blue-700 bg-white bg-opacity-90 px-2 py-0.5 rounded shadow-sm select-none pointer-events-none">
        Χρειάζεστε κάτι άλλο?
      </span>
      <button 
        className="bg-blue-600 text-white rounded-full shadow-lg p-4 hover:bg-blue-700 flex items-center justify-center transition-all" 
        onClick={onClick} 
        aria-label="Άνοιγμα ζωντανού chat"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
};

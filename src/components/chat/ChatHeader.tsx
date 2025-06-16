
import React from "react";

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center px-4 py-2 border-b border-gray-200 justify-between">
      <span className="font-semibold text-black">Chat Bot</span>
      <button 
        onClick={onClose} 
        className="ml-2 text-gray-500 hover:text-blue-500 text-lg font-bold" 
        aria-label="Κλείσιμο"
      >
        ×
      </button>
    </div>
  );
};

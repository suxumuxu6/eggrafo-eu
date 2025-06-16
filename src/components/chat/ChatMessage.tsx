
import React from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] mt-1 mb-1 ${
        message.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-700"
      }`}>
        {message.text && (
          <div className="whitespace-pre-line">
            {message.text}
          </div>
        )}
        {message.imageUrl && (
          <img 
            src={message.imageUrl} 
            alt="User uploaded" 
            className="mt-2 max-w-[160px] rounded shadow border" 
          />
        )}
      </div>
    </div>
  );
};

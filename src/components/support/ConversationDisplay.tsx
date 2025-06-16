
import React from "react";

interface ChatMessage {
  sender: "bot" | "user" | "admin";
  text: string;
  imageUrl?: string;
}

interface ConversationDisplayProps {
  conversation: ChatMessage[];
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ conversation }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Αρχική Συνομιλία</h3>
      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
        {conversation.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block p-2 rounded-lg max-w-xs ${
              msg.sender === "user" 
                ? "bg-blue-500 text-white" 
                : "bg-white border"
            }`}>
              <p className="text-sm">{msg.text}</p>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Attachment" className="mt-2 max-w-full rounded" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationDisplay;

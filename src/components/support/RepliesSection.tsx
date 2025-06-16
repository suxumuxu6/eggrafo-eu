
import React from "react";

interface SupportReply {
  id: string;
  message: string;
  sender: "user" | "admin";
  created_at: string;
  file_url?: string;
}

interface RepliesSectionProps {
  replies: SupportReply[];
}

const RepliesSection: React.FC<RepliesSectionProps> = ({ replies }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Απαντήσεις</h3>
      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
        {replies.length === 0 ? (
          <p className="text-gray-500 text-center">Δεν υπάρχουν απαντήσεις ακόμα.</p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className={`mb-3 ${reply.sender === "user" ? "text-right" : "text-left"}`}>
              <div className={`inline-block p-3 rounded-lg max-w-xs ${
                reply.sender === "user" 
                  ? "bg-blue-500 text-white" 
                  : "bg-green-500 text-white"
              }`}>
                <p className="text-sm">{reply.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  {reply.sender === "admin" ? "Διαχειριστής" : "Εσείς"} - {new Date(reply.created_at).toLocaleString('el-GR')}
                </p>
                {reply.file_url && (
                  <a href={reply.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                    Αρχείο συνημμένο
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepliesSection;

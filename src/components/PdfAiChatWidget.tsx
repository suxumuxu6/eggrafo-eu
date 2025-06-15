import React, { useState, useRef } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = "https://vcxwikgasrttbngdygig.functions.supabase.co/pdf-ai-chat";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const firstTimeGemhPrompt =
  "Εάν χρειάζεστε κάποιο διαφορετικό παράδειγμα εγγράφου για ΓΕΜΗ, γράψτε μας εδώ και θα σας βοηθήσουμε!";

const PdfAiChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Show the prompt as the first message, only if the user hasn't started chatting
  const shouldShowGemhPrompt = messages.length === 0 && open;

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: "ai", text: data.reply || "Δεν βρέθηκε απάντηση." },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "ai", text: "Κάτι πήγε στραβά. Προσπαθήστε ξανά!" },
      ]);
    }
    setInput("");
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 500);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="fixed bottom-6 right-24 z-50 bg-red-600 text-white rounded-full shadow-lg p-4 hover:bg-red-700 flex items-center justify-center transition-all"
          onClick={() => setOpen(true)}
          aria-label="Άνοιγμα συνομιλίας PDF AI"
        >
          <FileText className="w-7 h-7" />
        </button>
      )}

      {/* Chat Drawer */}
      {open && (
        <div className="fixed bottom-8 right-8 z-50 bg-white shadow-xl rounded-xl w-80 max-w-[95vw] flex flex-col border border-red-100 animate-fade-in">
          <div className="flex items-center px-4 py-2 border-b border-gray-200 justify-between">
            <span className="font-semibold text-red-700">AI Βοηθός PDF</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-2 text-kb-darkgray hover:text-red-500"
              aria-label="Κλείσιμο"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60">
            {/* Custom GEMH prompt */}
            {shouldShowGemhPrompt && (
              <div className="bg-red-50 border border-red-200 text-black text-sm rounded-lg px-3 py-2 mb-2 text-center font-semibold">
                {firstTimeGemhPrompt}
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-red-100 text-red-900"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-gray-200 flex gap-2 bg-gray-50">
            <input
              type="text"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Γράψτε το αίτημά σας..."
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="px-3"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              Αποστολή
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default PdfAiChatWidget;

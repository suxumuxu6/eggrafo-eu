
import React, { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
}
const initialMessage = "Γεια σας, επιλέξτε από τις παρακάτω επιλογές:";
const options = [
  "Θέλω ένα άλλο παράδειγμα εγγράφου",
  "Τεχνικό Θέμα με την λήψη αρχείου"
];

export const LiveChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awaitingOption, setAwaitingOption] = useState(true);
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ sender: "bot", text: initialMessage }]);
      setAwaitingOption(true);
      setCanSendMessage(false);
      setMessageInput("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [messages, open]);

  const handleOption = (option: string) => {
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: option }
    ]);
    let reply = "";
    if (option === options[0]) {
      reply = "Γράψτε την νομική μορφή";
    } else if (option === options[1]) {
      reply = "Περιγράψτε το τεχνικό πρόβλημα που αντιμετωπίζετε με τη λήψη αρχείου και θα βοηθήσουμε άμεσα.";
    }
    setTimeout(() => {
      setMessages(msgs =>
        [...msgs, { sender: "bot", text: reply }]
      );
      setCanSendMessage(true);
    }, 500);
    setAwaitingOption(false);
  };

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: trimmed }
    ]);
    // Determine next bot reply contextually
    setTimeout(() => {
      let nextBotMessage = "Ευχαριστούμε, λάβαμε το αίτημά σας. Θα επικοινωνήσουμε σύντομα!";
      // Check previous bot message for context
      // Find last bot message before this (last in messages array)
      const prevBotMessage = [...messages].reverse().find(msg => msg.sender === "bot")?.text;
      if (prevBotMessage === "Γράψτε την νομική μορφή") {
        nextBotMessage = "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε";
      }
      setMessages(msgs => [
        ...msgs,
        { sender: "bot", text: nextBotMessage }
      ]);
    }, 700);
    setMessageInput("");
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setMessages([]);
      setAwaitingOption(true);
      setCanSendMessage(false);
      setMessageInput("");
    }, 300);
  };

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg p-4 hover:bg-blue-700 flex items-center justify-center transition-all"
          onClick={() => setOpen(true)}
          aria-label="Άνοιγμα ζωντανού chat"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-8 right-6 z-50 bg-white shadow-xl rounded-xl w-80 max-w-[95vw] flex flex-col border border-blue-100 animate-fade-in">
          <div className="flex items-center px-4 py-2 border-b border-gray-200 justify-between">
            <span className="font-semibold text-black">Ζωντανό Chat</span>
            <button
              onClick={handleClose}
              className="ml-2 text-gray-500 hover:text-blue-500 text-lg font-bold"
              aria-label="Κλείσιμο"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                  msg.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-700"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {awaitingOption && (
              <div className="flex flex-col gap-2 mt-2">
                {options.map(opt => (
                  <Button
                    key={opt}
                    className="w-full"
                    onClick={() => handleOption(opt)}
                    variant="secondary"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
          {/* Message input area: only appears after option is picked */}
          {canSendMessage && (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="px-3 py-2 border-t border-gray-100 bg-white flex gap-2"
            >
              <Textarea
                className="flex-1 min-h-[40px] max-h-24 resize-none text-sm"
                placeholder="Γράψτε το μήνυμά σας…"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
              />
              <Button
                type="submit"
                className="self-end"
                disabled={!messageInput.trim()}
              >Αποστολή</Button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default LiveChatWidget;


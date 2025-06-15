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

type ChatStep =
  | "awaitingOption"
  | "waitingForLegalType"
  | "waitingForDetail"
  | "awaitingDetailsOrEmail"
  | "waitingForEmail"
  | "ended"
  | "techIssue"; // tech flow

const legalTypeOptions = [
  "ΟΕ-ΕΕ", "ΑΕ", "ΙΚΕ"
];

export const LiveChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("awaitingOption");
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ sender: "bot", text: initialMessage }]);
      setStep("awaitingOption");
      setCanSendMessage(false);
      setMessageInput("");
      setEmailInput("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [messages, open]);

  useEffect(() => {
    setIsEmailValid(validateEmail(emailInput));
  }, [emailInput]);

  function validateEmail(email: string) {
    // basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  const handleOption = (option: string) => {
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: option }
    ]);
    let reply = "";
    if (option === options[0]) {
      reply = "επιλέξτε μία από τις παρακάτω νομικές μορφές:";
      setTimeout(() => {
        setMessages(msgs =>
          [...msgs, { sender: "bot", text: reply }]
        );
        setStep("waitingForLegalType");
        setCanSendMessage(false); // Show legal options only
      }, 500);
    } else if (option === options[1]) {
      reply = "Περιγράψτε το τεχνικό πρόβλημα που αντιμετωπίζετε με τη λήψη αρχείου και θα βοηθήσουμε άμεσα.";
      setTimeout(() => {
        setMessages(msgs =>
          [...msgs, { sender: "bot", text: reply }]
        );
        setStep("techIssue");
        setCanSendMessage(true);
      }, 500);
    }
  };

  // After legal type selection, ask for detail only (no email field yet)
  const handleLegalTypeOption = (legalType: string) => {
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: legalType }
    ]);
    setTimeout(() => {
      setMessages(msgs =>
        [
          ...msgs,
          { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }
        ]
      );
      setStep("waitingForDetail");
      setCanSendMessage(true); // Show textarea to type detail
    }, 700);
  };

  // From "waitingForDetail", on send, ask for "Συνέχεια μηνύματος" or "Συμπληρώστε το email σας"
  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: trimmed }
    ]);
    setMessageInput("");
    if (step === "waitingForLegalType") {
      // Old: should not happen now with new flow, keep for safety
      setTimeout(() => {
        setMessages(msgs =>
          [
            ...msgs,
            { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }
          ]
        );
        setStep("waitingForDetail");
        setCanSendMessage(true);
      }, 700);
    } else if (step === "waitingForDetail") {
      setTimeout(() => {
        setStep("awaitingDetailsOrEmail");
        setCanSendMessage(false);
      }, 400);
    } else if (step === "techIssue") {
      // After techIssue send, ask for details or email
      setTimeout(() => {
        setStep("awaitingDetailsOrEmail");
        setCanSendMessage(false);
      }, 400);
    }
  };

  // User wants to continue with another detail
  const handleUserContinueDetail = () => {
    setStep("waitingForDetail");
    setCanSendMessage(true);
    setMessages(msgs => [
      ...msgs,
      { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }
    ]);
  };

  const handleUserProvideEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isEmailValid) return;
    setMessages(msgs => [
      ...msgs,
      { sender: "user", text: emailInput }
    ]);
    setEmailInput("");
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        { sender: "bot", text: "Τέλος συζήτησης" }
      ]);
      setStep("ended");
    }, 500);
  };

  const handleEndChat = () => {
    setOpen(false);
    setTimeout(() => {
      setMessages([]);
      setStep("awaitingOption");
      setCanSendMessage(false);
      setMessageInput("");
      setEmailInput("");
    }, 300);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUserProvideEmail();
    }
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
              onClick={handleEndChat}
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
            {step === "awaitingOption" && (
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
            {/* Legal type options */}
            {step === "waitingForLegalType" && (
              <div className="flex flex-col gap-2 mt-2">
                {legalTypeOptions.map(opt => (
                  <Button
                    key={opt}
                    className="w-full"
                    onClick={() => handleLegalTypeOption(opt)}
                    variant="secondary"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            {/* Textarea to let user type the detail */}
            {(step === "waitingForDetail" && canSendMessage) && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="px-0 py-2 flex gap-2"
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
            {/* After detail: show Συνέχεια μηνύματος or email */}
            {step === "awaitingDetailsOrEmail" && (
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleUserContinueDetail}
                >
                  Συνέχεια μηνύματος
                </Button>
                <form onSubmit={handleUserProvideEmail} className="flex gap-2 mt-2">
                  <input
                    type="email"
                    className="flex-1 min-w-0 rounded px-2 py-1 border border-gray-300 text-sm"
                    placeholder="Συμπληρώστε το email σας"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailInputKeyDown}
                    required
                  />
                  <Button
                    className="self-end"
                    type="submit"
                    disabled={!isEmailValid}
                  >OK</Button>
                </form>
              </div>
            )}
            {/* Ended: show 'Τέλος συζήτησης' button */}
            {step === "ended" && (
              <div className="flex flex-col gap-2 mt-2 items-center">
                <Button className="w-full" onClick={handleEndChat} variant="secondary">
                  Τέλος συζήτησης
                </Button>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
          {/* Only show message input for detail or techIssue */}
          {(step === "techIssue" && canSendMessage) && (
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

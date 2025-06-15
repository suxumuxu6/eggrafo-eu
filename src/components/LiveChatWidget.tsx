
import React, { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  imageUrl?: string;
}
const initialMessage = "Γεια σας, επιλέξτε από τις παρακάτω επιλογές:";
const options = ["Θέλω ένα άλλο παράδειγμα εγγράφου", "Τεχνικό Θέμα με την λήψη αρχείου"];
type ChatStep = "awaitingOption" | "waitingForLegalType" | "waitingForDetail" | "awaitingDetailsOrEmail" | "waitingForEmail" | "ended" | "techIssue" | "techIssue_waitingForEmail" | "techIssue_ended";
const legalTypeOptions = ["ΟΕ-ΕΕ", "ΑΕ", "ΙΚΕ"];

export const LiveChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("awaitingOption");
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        sender: "bot",
        text: initialMessage
      }]);
      setStep("awaitingOption");
      setCanSendMessage(false);
      setMessageInput("");
      setEmailInput("");
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({
        behavior: "smooth"
      }), 300);
    }
  }, [messages, open]);
  useEffect(() => {
    setIsEmailValid(validateEmail(emailInput));
  }, [emailInput]);
  // Image preview effect
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = e => setImagePreviewUrl(e.target?.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  const handleOption = (option: string) => {
    setMessages(msgs => [...msgs, { sender: "user", text: option }]);
    let reply = "";
    if (option === options[0]) {
      reply = "επιλέξτε μία από τις παρακάτω νομικές μορφές:";
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: "bot", text: reply }]);
        setStep("waitingForLegalType");
        setCanSendMessage(false);
      }, 500);
    } else if (option === options[1]) {
      reply = "Περιγράψτε το τεχνικό πρόβλημα που αντιμετωπίζετε με τη λήψη αρχείου και θα βοηθήσουμε άμεσα.";
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: "bot", text: reply }]);
        setStep("techIssue");
        setCanSendMessage(true);
      }, 500);
    }
  };
  const handleLegalTypeOption = (legalType: string) => {
    setMessages(msgs => [...msgs, { sender: "user", text: legalType }]);
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }]);
      setStep("waitingForDetail");
      setCanSendMessage(true);
    }, 700);
  };

  // Send message handler (image + text)
  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed && !imageFile) return;
    let userMessage: ChatMessage = { sender: "user", text: trimmed };
    if (imageFile && imagePreviewUrl) {
      userMessage.imageUrl = imagePreviewUrl;
    }
    setMessages(msgs => [...msgs, userMessage]);
    setMessageInput("");
    setImageFile(null);
    setImagePreviewUrl(null);

    // Dialog state transitions
    if (step === "waitingForLegalType") {
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }]);
        setStep("waitingForDetail");
        setCanSendMessage(true);
      }, 700);
    } else if (step === "waitingForDetail") {
      setTimeout(() => {
        setStep("awaitingDetailsOrEmail");
        setCanSendMessage(false);
      }, 400);
    } else if (step === "techIssue") {
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: "bot", text: "Συμπληρώστε το email σας για να έρθουμε σε επικοινωνία μαζί σας." }]);
        setStep("techIssue_waitingForEmail");
        setCanSendMessage(false);
      }, 500);
    }
  };

  const handleUserContinueDetail = () => {
    setStep("waitingForDetail");
    setCanSendMessage(true);
    setMessages(msgs => [...msgs, { sender: "bot", text: "Περιγράψτε με λεπτομέρεια τι είδος και τι ακριβώς θα θέλατε" }]);
  };

  const handleUserProvideEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isEmailValid) return;
    const userEmail = emailInput;
    setMessages(msgs => [...msgs, { sender: "user", text: userEmail }]);
    setEmailInput("");
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: "bot", text: "Τέλος - Αποστολή" }]);
      saveChatToSupabase([...messages, { sender: "user", text: userEmail }, { sender: "bot", text: "Τέλος - Αποστολή" }], userEmail);
      const nextStep = step === "techIssue_waitingForEmail" ? "techIssue_ended" : "ended";
      setStep(nextStep as ChatStep);
    }, 500);
  };

  const saveChatToSupabase = async (finalMessages: ChatMessage[], email: string) => {
    try {
      await supabase.from("chatbot_messages").insert({
        email: email || null,
        messages: finalMessages as unknown as import("@/integrations/supabase/types").Json
      });
    } catch (err) {
      console.error("Failed to save chatbot conversation:", err);
    }
  };
  const handleEndChat = () => {
    setOpen(false);
    setTimeout(() => {
      setMessages([]);
      setStep("awaitingOption");
      setCanSendMessage(false);
      setMessageInput("");
      setEmailInput("");
      setImageFile(null);
      setImagePreviewUrl(null);
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

  const handleStartOver = () => {
    setMessages([{ sender: "bot", text: initialMessage }]);
    setStep("awaitingOption");
    setCanSendMessage(false);
    setMessageInput("");
    setEmailInput("");
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  // Image file select handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Limit to images only and max 5MB
      if (!selected.type.startsWith("image/")) {
        alert("Μόνο εικόνες επιτρέπονται.");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        alert("Μέγιστο μέγεθος εικόνας 5MB.");
        return;
      }
      setImageFile(selected);
    }
  };

  return <>
      {!open && <div className="fixed bottom-20 right-6 z-50 flex flex-col items-center">
          <span className="mb-1 text-xs font-medium text-blue-700 bg-white bg-opacity-90 px-2 py-0.5 rounded shadow-sm select-none pointer-events-none">
            Chat
          </span>
          <button className="bg-blue-600 text-white rounded-full shadow-lg p-4 hover:bg-blue-700 flex items-center justify-center transition-all" onClick={() => setOpen(true)} aria-label="Άνοιγμα ζωντανού chat">
            <Bot className="w-7 h-7" />
          </button>
        </div>}
      {open && <div className="fixed bottom-8 right-6 z-50 bg-white shadow-xl rounded-xl w-80 max-w-[95vw] flex flex-col border border-blue-100 animate-fade-in">
          <div className="flex items-center px-4 py-2 border-b border-gray-200 justify-between">
            <span className="font-semibold text-black">Chat Bot</span>
            <button onClick={handleEndChat} className="ml-2 text-gray-500 hover:text-blue-500 text-lg font-bold" aria-label="Κλείσιμο">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60">
            {/* Message bubbles: support image messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] mt-1 mb-1 ${msg.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-700"}`}>
                  {msg.text && (
                    <div>
                      {msg.text}
                    </div>
                  )}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="User uploaded" className="mt-2 max-w-[160px] rounded shadow border" />
                  )}
                </div>
              </div>
            ))}
            {step === "awaitingOption" && <div className="flex flex-col gap-2 mt-2">
                {options.map(opt => (
                  <Button key={opt} className="w-full" onClick={() => handleOption(opt)} variant="secondary">
                    {opt}
                  </Button>
                ))}
              </div>}
            {step === "waitingForLegalType" && <div className="flex flex-col gap-2 mt-2">
                {legalTypeOptions.map(opt => (
                  <Button key={opt} className="w-full" onClick={() => handleLegalTypeOption(opt)} variant="secondary">
                    {opt}
                  </Button>
                ))}
              </div>}
            {step === "waitingForDetail" && canSendMessage &&
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="px-0 py-2 flex flex-col gap-2">
                <Textarea className="flex-1 min-h-[40px] max-h-24 resize-none text-sm" placeholder="Γράψτε το μήνυμά σας…" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={handleTextareaKeyDown} rows={1} />
                {/* Image picker + preview */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    id="chat-image-upload"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                    disabled={!!imageFile}
                  />
                  <label htmlFor="chat-image-upload" className="cursor-pointer">
                    <span className="text-xs text-blue-600 underline hover:text-blue-800">
                      Επισύναψη εικόνας
                    </span>
                  </label>
                  {imagePreviewUrl && (
                    <div className="flex items-center gap-1">
                      <img src={imagePreviewUrl} className="w-10 h-10 rounded object-cover border" alt="Προεπισκόπηση εικόνας" />
                      <button type="button" className="text-xs text-red-500 ml-1" onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <Button type="submit" className="self-end" disabled={!messageInput.trim() && !imageFile}>Αποστολή</Button>
              </form>}
            {step === "awaitingDetailsOrEmail" && <div className="flex flex-col gap-2 mt-2">
                <Button className="w-full" variant="secondary" onClick={handleUserContinueDetail}>Συνέχεια μηνύματος</Button>
                <form onSubmit={handleUserProvideEmail} className="flex gap-2 mt-2">
                  <input type="email" className="flex-1 min-w-0 rounded px-2 py-1 border border-gray-300 text-sm" placeholder="Συμπληρώστε το email σας" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={handleEmailInputKeyDown} required />
                  <Button className="self-end" type="submit" disabled={!isEmailValid}>OK</Button>
                </form>
              </div>}
            {step === "techIssue_waitingForEmail" && <form onSubmit={handleUserProvideEmail} className="flex gap-2 mt-2">
                <input type="email" className="flex-1 min-w-0 rounded px-2 py-1 border border-gray-300 text-sm" placeholder="Συμπληρώστε το email σας" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={handleEmailInputKeyDown} required />
                <Button className="self-end" type="submit" disabled={!isEmailValid}>OK</Button>
              </form>}
            {(step === "ended" || step === "techIssue_ended") && <div className="flex flex-col gap-2 mt-2 items-center">
                <Button className="w-full" onClick={handleEndChat} variant="secondary">Τέλος - Αποστολή</Button>
              </div>}
            <div ref={bottomRef}></div>
          </div>
          {/* Image upload and preview for tech issue textarea */}
          {step === "techIssue" && canSendMessage &&
            <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="px-3 py-2 border-t border-gray-100 bg-white flex flex-col gap-2">
              <Textarea className="flex-1 min-h-[40px] max-h-24 resize-none text-sm" placeholder="Γράψτε το μήνυμά σας…" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={handleTextareaKeyDown} rows={1} />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  id="chat-image-upload-tech"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  disabled={!!imageFile}
                />
                <label htmlFor="chat-image-upload-tech" className="cursor-pointer">
                  <span className="text-xs text-blue-600 underline hover:text-blue-800">
                    Επισύναψη εικόνας
                  </span>
                </label>
                {imagePreviewUrl && (
                  <div className="flex items-center gap-1">
                    <img src={imagePreviewUrl} className="w-10 h-10 rounded object-cover border" alt="Προεπισκόπηση εικόνας" />
                    <button type="button" className="text-xs text-red-500 ml-1" onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <Button type="submit" className="self-end" disabled={!messageInput.trim() && !imageFile}>Αποστολή</Button>
            </form>}
          {open && !(step === "awaitingOption" && messages.length === 1 && messages[0].sender === "bot") && <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Button variant="outline" size="sm" onClick={handleStartOver}>Ξεκινήστε από την αρχή</Button>
            </div>}
        </div>}
    </>;
};
export default LiveChatWidget;

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatToggleButton } from "./chat/ChatToggleButton";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatOptions } from "./chat/ChatOptions";
import { ChatInput } from "./chat/ChatInput";
import { EmailInput } from "./chat/EmailInput";
import { SupportTicketDisplay } from "./chat/SupportTicketDisplay";
import { useChatState } from "@/hooks/useChatState";
import { uploadImageToSupabase } from "@/utils/imageUtils";
import { generateSupportTicketCode } from "@/utils/ticketUtils";
import { saveChatToSupabase } from "@/utils/chatStorage";
import { ChatMessage as ChatMessageType } from "@/types/chat";

export const LiveChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    setMessages,
    step,
    setStep,
    canSendMessage,
    setCanSendMessage,
    messageInput,
    setMessageInput,
    emailInput,
    setEmailInput,
    isEmailValid,
    imageFile,
    setImageFile,
    imagePreviewUrl,
    supportTicketCode,
    setSupportTicketCode,
    resetChat,
    clearChat
  } = useChatState();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        sender: "bot",
        text: "Γεια σας, επιλέξτε από τις παρακάτω επιλογές:"
      }]);
      setStep("awaitingOption");
      setCanSendMessage(false);
      setMessageInput("");
      setEmailInput("");
      setImageFile(null);
      setSupportTicketCode("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({
        behavior: "smooth"
      }), 300);
    }
  }, [messages, open]);

  const handleOption = (option: string) => {
    setMessages(msgs => [...msgs, { sender: "user", text: option }]);
    let reply = "";
    if (option === "Θέλω ένα άλλο παράδειγμα εγγράφου") {
      reply = "επιλέξτε μία από τις παρακάτω νομικές μορφές:";
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: "bot", text: reply }]);
        setStep("waitingForLegalType");
        setCanSendMessage(false);
      }, 500);
    } else if (option === "Τεχνικό Θέμα με την λήψη αρχείου") {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed && !imageFile) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      imageUrl = await uploadImageToSupabase(imageFile);
      if (!imageUrl) return;
    }

    let userMessage: ChatMessageType = { sender: "user", text: trimmed };
    if (imageUrl) userMessage.imageUrl = imageUrl;
    setMessages(msgs => [...msgs, userMessage]);
    setMessageInput("");
    setImageFile(null);

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
    
    const ticketCode = generateSupportTicketCode();
    setSupportTicketCode(ticketCode);
    
    const confirmationMessage = `Το αίτημά σας έχει καταχωρηθεί με επιτυχία!

Θα λάβετε ειδοποίηση στο email σας με οδηγίες πρόσβασης και όταν υπάρχει νέα απάντηση από την ομάδα υποστήριξης.

Ευχαριστούμε για την επικοινωνία!`;
    
    setTimeout(async () => {
      setMessages(msgs => [...msgs, { 
        sender: "bot", 
        text: confirmationMessage
      }]);
      
      // Save the chat and send notifications
      console.log("Saving chat and sending notifications...");
      const success = await saveChatToSupabase([
        ...messages, 
        { sender: "user", text: userEmail }, 
        { 
          sender: "bot", 
          text: confirmationMessage
        }
      ], userEmail, ticketCode);
      
      if (success) {
        console.log("Chat saved and notifications sent successfully");
      } else {
        console.error("Failed to save chat or send notifications");
      }
      
      const nextStep = step === "techIssue_waitingForEmail" ? "techIssue_ended" : "ended";
      setStep(nextStep);
    }, 500);
  };

  const handleEndChat = () => {
    setOpen(false);
    setTimeout(() => {
      clearChat();
    }, 300);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
  };

  if (!open) {
    return <ChatToggleButton onClick={() => setOpen(true)} />;
  }

  return (
    <div className="fixed bottom-8 right-6 z-50 bg-white shadow-xl rounded-xl w-80 max-w-[95vw] flex flex-col border border-blue-100 animate-fade-in">
      <ChatHeader onClose={handleEndChat} />
      
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 h-60">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {step === "awaitingOption" && (
          <ChatOptions type="main" onOptionSelect={handleOption} />
        )}

        {step === "waitingForLegalType" && (
          <ChatOptions type="legal" onOptionSelect={handleLegalTypeOption} />
        )}

        {step === "waitingForDetail" && canSendMessage && (
          <ChatInput
            messageInput={messageInput}
            onMessageChange={setMessageInput}
            onSubmit={handleSendMessage}
            imageFile={imageFile}
            imagePreviewUrl={imagePreviewUrl}
            onImageChange={handleImageChange}
            uploadId="chat-image-upload"
          />
        )}

        {step === "awaitingDetailsOrEmail" && (
          <div className="flex flex-col gap-2 mt-2">
            <Button className="w-full" variant="secondary" onClick={handleUserContinueDetail}>
              Συνέχεια μηνύματος
            </Button>
            <EmailInput
              emailInput={emailInput}
              onEmailChange={setEmailInput}
              onSubmit={handleUserProvideEmail}
              isEmailValid={isEmailValid}
            />
          </div>
        )}

        {step === "techIssue_waitingForEmail" && (
          <EmailInput
            emailInput={emailInput}
            onEmailChange={setEmailInput}
            onSubmit={handleUserProvideEmail}
            isEmailValid={isEmailValid}
          />
        )}

        {(step === "ended" || step === "techIssue_ended") && (
          <SupportTicketDisplay
            supportTicketCode={supportTicketCode}
            onEndChat={handleEndChat}
          />
        )}

        <div ref={bottomRef}></div>
      </div>

      {step === "techIssue" && canSendMessage && (
        <div className="px-3 py-2 border-t border-gray-100 bg-white">
          <ChatInput
            messageInput={messageInput}
            onMessageChange={setMessageInput}
            onSubmit={handleSendMessage}
            imageFile={imageFile}
            imagePreviewUrl={imagePreviewUrl}
            onImageChange={handleImageChange}
            uploadId="chat-image-upload-tech"
          />
        </div>
      )}

      {open && !(step === "awaitingOption" && messages.length === 1 && messages[0].sender === "bot") && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-center">
          <Button variant="outline" size="sm" onClick={resetChat}>
            Ξεκινήστε από την αρχή
          </Button>
        </div>
      )}
    </div>
  );
};

export default LiveChatWidget;

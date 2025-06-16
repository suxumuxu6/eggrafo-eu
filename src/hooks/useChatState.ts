
import { useState, useEffect } from "react";
import { ChatMessage, ChatStep, INITIAL_MESSAGE } from "@/types/chat";

export const useChatState = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("awaitingOption");
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [supportTicketCode, setSupportTicketCode] = useState<string>("");

  useEffect(() => {
    setIsEmailValid(validateEmail(emailInput));
  }, [emailInput]);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = e => setImagePreviewUrl(e.target?.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const resetChat = () => {
    setMessages([{ sender: "bot", text: INITIAL_MESSAGE }]);
    setStep("awaitingOption");
    setCanSendMessage(false);
    setMessageInput("");
    setEmailInput("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setSupportTicketCode("");
  };

  const clearChat = () => {
    setMessages([]);
    setStep("awaitingOption");
    setCanSendMessage(false);
    setMessageInput("");
    setEmailInput("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setSupportTicketCode("");
  };

  return {
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
    setImagePreviewUrl,
    supportTicketCode,
    setSupportTicketCode,
    resetChat,
    clearChat
  };
};


import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";

interface ChatInputProps {
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  onImageChange: (file: File | null) => void;
  uploadId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  messageInput,
  onMessageChange,
  onSubmit,
  imageFile,
  imagePreviewUrl,
  onImageChange,
  uploadId
}) => {
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={onSubmit} className="px-0 py-2 flex flex-col gap-2">
      <Textarea 
        className="flex-1 min-h-[40px] max-h-24 resize-none text-sm" 
        placeholder="Γράψτε το μήνυμά σας…" 
        value={messageInput} 
        onChange={e => onMessageChange(e.target.value)} 
        onKeyDown={handleTextareaKeyDown} 
        rows={1} 
      />
      <ImageUpload
        imageFile={imageFile}
        imagePreviewUrl={imagePreviewUrl}
        onImageChange={onImageChange}
        uploadId={uploadId}
      />
      <Button 
        type="submit" 
        className="self-end" 
        disabled={!messageInput.trim() && !imageFile}
      >
        Αποστολή
      </Button>
    </form>
  );
};

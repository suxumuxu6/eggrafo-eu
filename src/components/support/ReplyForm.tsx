
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import UserSupportFileUpload from "./UserSupportFileUpload";

interface ReplyFormProps {
  newReply: string;
  setNewReply: (reply: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  onSendReply: () => void;
  isLoading: boolean;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
  newReply,
  setNewReply,
  uploadedFile,
  setUploadedFile,
  onSendReply,
  isLoading
}) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="newReply">Νέα Απάντηση</Label>
      <Textarea
        id="newReply"
        value={newReply}
        onChange={(e) => setNewReply(e.target.value)}
        placeholder="Γράψτε την απάντησή σας..."
        rows={4}
      />
      
      <UserSupportFileUpload onFileSelect={setUploadedFile} />
      
      <Button 
        onClick={onSendReply} 
        disabled={isLoading || !newReply.trim()}
        className="w-full"
      >
        {isLoading ? "Αποστολή..." : "Αποστολή Απάντησης"}
      </Button>
    </div>
  );
};

export default ReplyForm;

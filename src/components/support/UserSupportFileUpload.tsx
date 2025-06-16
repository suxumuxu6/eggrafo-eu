
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserSupportFileUploadProps {
  onFileSelect: (file: File | null) => void;
}

const UserSupportFileUpload: React.FC<UserSupportFileUploadProps> = ({ onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div>
      <Label htmlFor="fileUpload">Επισύναψη Αρχείου (προαιρετικό)</Label>
      <Input
        id="fileUpload"
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
    </div>
  );
};

export default UserSupportFileUpload;

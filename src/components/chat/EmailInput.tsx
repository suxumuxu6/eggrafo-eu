
import React from "react";
import { Button } from "@/components/ui/button";

interface EmailInputProps {
  emailInput: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isEmailValid: boolean;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  emailInput,
  onEmailChange,
  onSubmit,
  isEmailValid
}) => {
  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 mt-2">
      <input 
        type="email" 
        className="flex-1 min-w-0 rounded px-2 py-1 border border-gray-300 text-sm" 
        placeholder="Συμπληρώστε το email σας" 
        value={emailInput} 
        onChange={e => onEmailChange(e.target.value)} 
        onKeyDown={handleEmailInputKeyDown} 
        required 
      />
      <Button 
        className="self-end" 
        type="submit" 
        disabled={!isEmailValid}
      >
        OK
      </Button>
    </form>
  );
};

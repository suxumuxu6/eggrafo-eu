
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isUploading: boolean;
  file: File | null;
  category: string;
  onReset: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({
  isUploading,
  file,
  category,
  onReset
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        type="submit" 
        className="flex-1 bg-blue-600 hover:bg-blue-700"
        disabled={isUploading || !file || !category}
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
      <Button 
        type="button" 
        variant="outline"
        onClick={onReset}
        disabled={isUploading}
      >
        Clear Form
      </Button>
    </div>
  );
};

export default FormActions;

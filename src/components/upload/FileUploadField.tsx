
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from "sonner";

interface FileUploadFieldProps {
  file: File | null;
  setFile: (file: File | null) => void;
  isUploading: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({ file, setFile, isUploading }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="file" className="block text-sm font-medium text-gray-700">
        PDF File
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          id="file"
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleFileChange}
          required
          disabled={isUploading}
        />
        <label 
          htmlFor="file"
          className={`flex flex-col items-center justify-center cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          {file ? (
            <span className="text-sm font-medium text-kb-purple">
              {file.name} ({Math.round(file.size / 1024)} KB)
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Click to browse or drag and drop a PDF file
            </span>
          )}
        </label>
      </div>
    </div>
  );
};

export default FileUploadField;

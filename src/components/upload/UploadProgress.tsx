
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ isUploading, uploadProgress }) => {
  if (!isUploading) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Uploading...</span>
        <span className="text-sm font-medium">{uploadProgress}%</span>
      </div>
      <Progress value={uploadProgress} className="h-2" />
    </div>
  );
};

export default UploadProgress;

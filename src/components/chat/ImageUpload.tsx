
import React from "react";
import { MAX_IMAGE_SIZE_MB } from "@/types/chat";

interface ImageUploadProps {
  imageFile: File | null;
  imagePreviewUrl: string | null;
  onImageChange: (file: File | null) => void;
  uploadId: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  imageFile, 
  imagePreviewUrl, 
  onImageChange, 
  uploadId 
}) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/")) {
        alert("Μόνο εικόνες επιτρέπονται.");
        return;
      }
      if (selected.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`Μέγιστο μέγεθος εικόνας ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      onImageChange(selected);
    }
  };

  const clearImage = () => {
    onImageChange(null);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        id={uploadId}
        style={{ display: "none" }}
        onChange={handleImageChange}
        disabled={!!imageFile}
      />
      <label htmlFor={uploadId} className="cursor-pointer">
        <span className="text-xs text-blue-600 underline hover:text-blue-800">
          Επισύναψη εικόνας
        </span>
      </label>
      {imagePreviewUrl && (
        <div className="flex items-center gap-1">
          <img 
            src={imagePreviewUrl} 
            className="w-10 h-10 rounded object-cover border" 
            alt="Προεπισκόπηση εικόνας" 
          />
          <button 
            type="button" 
            className="text-xs text-red-500 ml-1" 
            onClick={clearImage}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

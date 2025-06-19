
import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUploadField from './FileUploadField';
import UploadProgress from './UploadProgress';
import CategorySelector from './CategorySelector';
import FormFields from './FormFields';
import FormActions from './FormActions';
import { useFormStorage } from './useFormStorage';

interface UploadFormProps {
  onSubmit: (data: DocumentFormData) => Promise<boolean | void>; 
  isUploading: boolean;
  uploadProgress: number;
  errorMessage: string | null;
}

interface DocumentFormData {
  title: string;
  description: string;
  tags: string;
  category: string;
  file: File | null;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
  onSubmit, 
  isUploading, 
  uploadProgress, 
  errorMessage 
}) => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    category,
    setCategory,
    clearStorage,
    resetForm
  } = useFormStorage();

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      return;
    }
    if (!category) {
      return;
    }
    
    const success = await onSubmit({
      title,
      description,
      tags,
      category,
      file
    });

    // Clear saved data on successful submission
    if (success) {
      clearStorage();
      resetForm();
      setFile(null);
    }
  };

  const handleReset = () => {
    resetForm();
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <CategorySelector
        category={category}
        setCategory={setCategory}
        isUploading={isUploading}
      />

      <FormFields
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        tags={tags}
        setTags={setTags}
        isUploading={isUploading}
      />

      <FileUploadField 
        file={file}
        setFile={setFile}
        isUploading={isUploading}
      />

      <UploadProgress 
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <FormActions
        isUploading={isUploading}
        file={file}
        category={category}
        onReset={handleReset}
      />
    </form>
  );
};

export { UploadForm, type DocumentFormData };

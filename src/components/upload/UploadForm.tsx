import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUploadField from './FileUploadField';
import UploadProgress from './UploadProgress';

interface UploadFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  errorMessage: string | null;
}

interface FormData {
  title: string;
  description: string;
  tags: string;
  file: File | null;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, isUploading, uploadProgress, errorMessage }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      return;
    }
    
    await onSubmit({
      title,
      description,
      tags,
      file
    });
    
    // Reset form on successful upload (this will be called by parent component)
    // We keep the form state here for simplicity
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Document Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          required
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter document description"
          required
          className="min-h-[100px]"
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma separated)
        </label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="guide, tutorial, reference"
          disabled={isUploading}
        />
      </div>

      <FileUploadField 
        file={file}
        setFile={setFile}
        isUploading={isUploading}
      />

      <UploadProgress 
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <Button 
        type="submit" 
        className="w-full bg-kb-purple hover:bg-kb-purple/90"
        disabled={isUploading || !file}
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
};

export { UploadForm, type FormData };

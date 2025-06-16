
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUploadField from './FileUploadField';
import UploadProgress from './UploadProgress';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const CATEGORIES = [
  {
    value: "download_example",
    label: "Παραδείγματα Εγγράφων για λήψη (διαθέσιμο μόνο με δωρεά)"
  },
  {
    value: "company_laws",
    label: "Νόμοι Εταιρειών (δωρεάν λήψη)"
  }
];

const STORAGE_KEY = 'upload_form_data';

const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, isUploading, uploadProgress, errorMessage }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setTags(parsed.tags || '');
        setCategory(parsed.category || '');
        // Note: File cannot be restored from localStorage due to security restrictions
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      title,
      description,
      tags,
      category
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [title, description, tags, category]);

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
      localStorage.removeItem(STORAGE_KEY);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setCategory('');
    setFile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Πού θέλετε να ανέβει το έγγραφο;
          <span className="text-red-500 text-base">*</span>
        </label>
        <RadioGroup
          value={category}
          onValueChange={setCategory}
          disabled={isUploading}
          className="flex flex-col gap-3"
        >
          {CATEGORIES.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value={option.value} id={option.value} disabled={isUploading} />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
        {!category && (
          <div className="text-xs text-red-600 mt-1">Παρακαλώ επιλέξτε μία επιλογή</div>
        )}
      </div>

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
          placeholder="Enter document description (optional)"
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
          onClick={resetForm}
          disabled={isUploading}
        >
          Clear Form
        </Button>
      </div>
    </form>
  );
};

export { UploadForm, type DocumentFormData };

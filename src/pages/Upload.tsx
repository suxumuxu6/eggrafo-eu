
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      toast.error('You must be logged in to access this page');
      navigate('/home');
    } else if (!isAdmin) {
      toast.error('You must be an administrator to access this page');
      navigate('/home');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setErrorMessage(null);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    
    try {
      console.log('Starting file upload process...');
      
      // Check if user is authenticated in our custom auth system
      if (!isAuthenticated || !user) {
        throw new Error('You must be logged in to upload documents');
      }
      
      // Create a unique file name with timestamp to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log(`Uploading file to path: ${filePath}`);
      
      // Set up progress tracking using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600',
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      console.log('File uploaded successfully, now saving metadata...');
      
      // Get the public URL for the uploaded file
      const { data: publicURLData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      const fileUrl = publicURLData.publicUrl;
      
      // Convert tags string to array
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
      // Save document metadata to database
      const { error: metadataError } = await supabase
        .from('documents')
        .insert({
          title, 
          description, 
          tags: tagsArray, 
          file_url: fileUrl,
          created_by: user.id || 'admin'
        });
        
      if (metadataError) {
        console.error('Metadata error:', metadataError);
        throw new Error(`Error saving document metadata: ${metadataError.message}`);
      }
      
      toast.success(`Document "${title}" uploaded successfully!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setFile(null);
      setUploadProgress(0);
      
      // Navigate to home page after success
      navigate('/home');
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'Failed to upload document. Please try again.');
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // If not authenticated or not admin, the useEffect will handle the redirect
  // This prevents flashing the upload form briefly before redirect
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-kb-darkgray">Upload Document</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add new PDF documents to the knowledge base for users to search and access.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Uploading...</span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-kb-purple hover:bg-kb-purple/90"
                disabled={isUploading || !file}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UploadPage;

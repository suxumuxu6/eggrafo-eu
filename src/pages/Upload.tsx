
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    
    try {
      console.log('Starting file upload process...');
      
      // Create a unique file name with timestamp to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      console.log(`Uploading file to path: ${filePath}`);
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Error uploading file');
      }
      
      console.log('File uploaded successfully, now saving metadata...');
      
      // Get the public URL for the uploaded file
      const { data: publicURLData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      const fileUrl = publicURLData.publicUrl;
      
      // Convert tags string to array
      const tagsArray = tags.split(',').map(tag => tag.trim());
      
      // Save document metadata to database
      const { error: metadataError } = await supabase
        .from('documents')
        .insert({
          title, 
          description, 
          tags: tagsArray, 
          file_url: fileUrl,
          created_by: 'admin' // In a real app, you'd use the user's ID
        });
        
      if (metadataError) {
        console.error('Metadata error:', metadataError);
        throw new Error('Error saving document metadata');
      }
      
      toast.success(`Document "${title}" uploaded successfully!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setFile(null);
      
      // Navigate to home page after success
      navigate('/home');
    } catch (error) {
      console.error('Upload error:', error);
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
                  />
                  <label 
                    htmlFor="file"
                    className="flex flex-col items-center justify-center cursor-pointer"
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

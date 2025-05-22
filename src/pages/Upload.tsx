
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { toast } from "sonner";
import { Card, CardContent } from '@/components/ui/card';
import { UploadForm } from '../components/upload/UploadForm';
import { useFileUpload } from '../components/upload/useFileUpload';

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { uploadDocument, isUploading, uploadProgress, errorMessage } = useFileUpload();

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

  // If not authenticated or not admin, the useEffect will handle the redirect
  // This prevents flashing the upload form briefly before redirect
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // Using the same function signature as defined in the components
  const handleUpload = async (formData) => {
    return await uploadDocument(formData);
  };

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
            <UploadForm 
              onSubmit={handleUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              errorMessage={errorMessage}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UploadPage;

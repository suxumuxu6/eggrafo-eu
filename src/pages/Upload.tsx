
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { UploadForm } from "../components/upload/UploadForm";
import { useFileUpload } from "../components/upload/useFileUpload";
import { DocumentFormData } from "../components/upload/UploadForm";

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { uploadDocument, isUploading, uploadProgress, errorMessage } = useFileUpload();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  console.log('Upload page render:', { isAuthenticated, isAdmin, loading, hasUser: !!user });

  useEffect(() => {
    // Wait for auth to load completely
    if (!loading) {
      console.log('Auth loading complete, checking permissions');
      
      // Check if user is not authenticated
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, redirecting to home');
        toast.error("Πρέπει να συνδεθείτε για πρόσβαση στη σελίδα.");
        navigate("/home");
        return;
      }

      // Check if user is not admin
      if (!isAdmin) {
        console.log('User not admin, redirecting to home');
        toast.error("Πρέπει να είστε διαχειριστής για upload.");
        navigate("/home");
        return;
      }

      console.log('User is authenticated admin, allowing access');
      setAuthCheckComplete(true);
    }
  }, [isAuthenticated, isAdmin, loading, user, navigate]);

  // Show loading while auth is being checked
  if (loading || !authCheckComplete) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Έλεγχος δικαιωμάτων...</p>
        </div>
      </div>
    );
  }

  // Final safety check - this should not render if user doesn't have proper permissions
  if (!isAuthenticated || !isAdmin || !user) {
    return null;
  }

  const handleUpload = async (formData: DocumentFormData) => {
    return await uploadDocument(formData);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-900">
            Upload Document
          </h1>
          <p className="text-blue-700 max-w-2xl mx-auto">
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

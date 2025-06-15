import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { UploadForm } from "../components/upload/UploadForm";
import { useFileUpload } from "../components/upload/useFileUpload";
import { DocumentFormData } from "../components/upload/UploadForm";

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { uploadDocument, isUploading, uploadProgress, errorMessage } =
    useFileUpload();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        toast.error("Πρέπει να συνδεθείτε για πρόσβαση στη σελίδα.");
        navigate("/home");
      } else if (!isAdmin) {
        toast.error("Πρέπει να είστε διαχειριστής για upload.");
        navigate("/home");
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  if (loading || !isAuthenticated || !isAdmin) {
    // Avoid flash while checking
    return null;
  }

  // Handle document upload with the correct type
  const handleUpload = async (formData: DocumentFormData) => {
    return await uploadDocument(formData);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
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

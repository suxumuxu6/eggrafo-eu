
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { UploadForm } from "../components/upload/UploadForm";
import { useFileUpload } from "../components/upload/useFileUpload";
import { DocumentFormData } from "../components/upload/UploadForm";
import { requireAdminAuth } from "@/utils/authSecurity";

const UploadPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { uploadDocument, isUploading, uploadProgress, errorMessage } = useFileUpload();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [securityVerified, setSecurityVerified] = useState(false);

  console.log('Upload page render:', { isAuthenticated, isAdmin, loading, hasUser: !!user });

  useEffect(() => {
    const performSecurityCheck = async () => {
      // Wait for auth to load completely
      if (loading) return;

      console.log('Auth loading complete, performing security check');
      
      // Basic authentication check
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, redirecting to home');
        toast.error("Πρέπει να συνδεθείτε για πρόσβαση στη σελίδα.");
        navigate("/home");
        return;
      }

      // Enhanced admin verification
      try {
        const isValidAdmin = await requireAdminAuth();
        
        if (!isValidAdmin) {
          console.log('Admin verification failed, redirecting to home');
          toast.error("Πρέπει να είστε διαχειριστής για upload.");
          navigate("/home");
          return;
        }

        console.log('Security verification passed');
        setSecurityVerified(true);
        setAuthCheckComplete(true);
      } catch (error) {
        console.error('Security check failed:', error);
        toast.error("Σφάλμα επαλήθευσης ασφαλείας.");
        navigate("/home");
      }
    };

    performSecurityCheck();
  }, [isAuthenticated, isAdmin, loading, user, navigate]);

  // Show loading while auth and security checks are being performed
  if (loading || !authCheckComplete || !securityVerified) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {loading ? 'Έλεγχος δικαιωμάτων...' : 'Επαλήθευση ασφαλείας...'}
          </p>
        </div>
      </div>
    );
  }

  // Final safety check
  if (!isAuthenticated || !isAdmin || !user || !securityVerified) {
    return null;
  }

  const handleUpload = async (formData: DocumentFormData) => {
    // Additional security check before upload
    const isStillAdmin = await requireAdminAuth();
    if (!isStillAdmin) {
      toast.error("Τα δικαιώματα διαχειριστή έχουν ανακληθεί.");
      navigate("/home");
      return false;
    }
    
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

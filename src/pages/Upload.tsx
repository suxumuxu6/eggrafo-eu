
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
  const { uploadDocument, isUploading, uploadProgress, errorMessage } =
    useFileUpload();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Περιμένουμε να ολοκληρωθεί το loading και στη συνέχεια κάνουμε τον έλεγχο
    if (!loading && !hasCheckedAuth) {
      if (!isAuthenticated) {
        toast.error("Πρέπει να συνδεθείτε για πρόσβαση στη σελίδα.");
        navigate("/home");
      } else if (!isAdmin) {
        // Περιμένουμε λίγο ακόμα για να είμαστε σίγουροι ότι ο έλεγχος isAdmin έχει ολοκληρωθεί
        setTimeout(() => {
          if (!isAdmin) {
            toast.error("Πρέπει να είστε διαχειριστής για upload.");
            navigate("/home");
          }
        }, 100);
      }
      setHasCheckedAuth(true);
    }
  }, [isAuthenticated, isAdmin, loading, navigate, hasCheckedAuth]);

  // Reset hasCheckedAuth when loading changes (π.χ. όταν αλλάζει tab)
  useEffect(() => {
    if (loading) {
      setHasCheckedAuth(false);
    }
  }, [loading]);

  if (loading || !hasCheckedAuth) {
    // Δείχνουμε loading state όσο ελέγχουμε τα δικαιώματα
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Έλεγχος δικαιωμάτων...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    // Αυτό θα εκτελεστεί μόνο αν πραγματικά δεν έχουμε δικαιώματα
    return null;
  }

  // Handle document upload with the correct type
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

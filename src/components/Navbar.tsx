
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, LogOut, Bot } from "lucide-react";

const Navbar: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
    signOut
  } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  // Auth modal navigation will be handled on the auth page
  const handleOpenLogin = () => {
    navigate("/auth");
  };
  return <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/lovable-uploads/6e155ba5-d73d-4a6b-94f6-a6c56b4e33c4.png" alt="Logo" className="h-10 w-10 object-contain rounded-md border border-gray-200 bg-white" style={{
              background: "white"
            }} />
              <span className="font-bold text-xl text-kb-darkgray">Eggrafo</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? null : isAuthenticated && isAdmin ? (
              <>
                {/* Chatbot link before upload */}
                <Link to="/admin-chatbot">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>Chatbot</span>
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                </Link>
                <Button variant="ghost" className="text-kb-darkgray hover:text-kb-purple flex items-center gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Έξοδος</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>;
};

export default Navbar;

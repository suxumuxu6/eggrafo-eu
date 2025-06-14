import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Upload, LogOut, Lock } from 'lucide-react';
import AdminLoginModal from './AdminLoginModal';

const Navbar: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    logout
  } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                {/* Logo image */}
                <img
                  src="/lovable-uploads/6e155ba5-d73d-4a6b-94f6-a6c56b4e33c4.png"
                  alt="Logo"
                  className="h-10 w-10 object-contain rounded-md border border-gray-200 bg-white"
                  style={{ background: "white" }}
                />
                <span className="font-bold text-xl text-kb-darkgray">eggrafo.eu</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <Button variant="ghost" className="text-kb-darkgray hover:text-kb-purple flex items-center space-x-2" onClick={() => setIsLoginModalOpen(true)}>
                  <Lock className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              ) : (
                <>
                  {isAdmin && (
                    <Link to="/upload">
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" className="text-kb-darkgray hover:text-kb-purple flex items-center space-x-2" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    <span>Έξοδος</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <AdminLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
export default Navbar;

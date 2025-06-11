import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Upload, LogOut } from 'lucide-react';
const Navbar: React.FC = () => {
  const {
    isAdmin,
    logout
  } = useAuth();
  return <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/home" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-kb-purple" />
              <span className="font-bold text-xl text-kb-darkgray">Knowledge Portal</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && <Link to="/upload">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
              </Link>}
            <Button variant="ghost" className="text-kb-darkgray hover:text-kb-purple flex items-center space-x-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span>Έξοδος</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;
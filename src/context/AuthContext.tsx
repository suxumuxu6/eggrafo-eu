
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real application, you would use proper authentication
// with a backend server, JWT tokens, etc.
// This is a simplified example for demonstration purposes
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage on initial load
    const authStatus = localStorage.getItem('kbAuth');
    const adminStatus = localStorage.getItem('kbAdmin');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      // Create a mock user when loading from localStorage
      setUser({ id: localStorage.getItem('kbUserId') || 'admin' });
    }
    
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const login = async (password: string): Promise<boolean> => {
    // In a real application, this would be a server request
    // For demo purposes, we'll use simple hardcoded passwords
    if (password === 'qazWSX86+!') {
      const userId = 'admin-' + Date.now();
      localStorage.setItem('kbUserId', userId);
      setUser({ id: userId });
      setIsAuthenticated(true);
      setIsAdmin(true);
      localStorage.setItem('kbAuth', 'true');
      localStorage.setItem('kbAdmin', 'true');
      toast.success('Logged in as administrator');
      navigate('/home');
      return true;
    } else if (password === 'tmimaoe-ee2025!') {
      const userId = 'user-' + Date.now();
      localStorage.setItem('kbUserId', userId);
      setUser({ id: userId });
      setIsAuthenticated(true);
      setIsAdmin(false);
      localStorage.setItem('kbAuth', 'true');
      localStorage.setItem('kbAdmin', 'false');
      toast.success('Logged in as user');
      navigate('/home');
      return true;
    } else {
      toast.error('Invalid password');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem('kbAuth');
    localStorage.removeItem('kbAdmin');
    localStorage.removeItem('kbUserId');
    toast.info('Logged out successfully');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


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
  login: (password: string, rememberMe?: boolean) => Promise<boolean>;
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
    const loginExpiry = localStorage.getItem('kbLoginExpiry');
    
    // Check if login has expired
    if (loginExpiry && Date.now() > parseInt(loginExpiry)) {
      // Login has expired, clear all auth data
      localStorage.removeItem('kbAuth');
      localStorage.removeItem('kbAdmin');
      localStorage.removeItem('kbUserId');
      localStorage.removeItem('kbLoginExpiry');
      return;
    }
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      // Create a mock user when loading from localStorage
      setUser({ id: localStorage.getItem('kbUserId') || 'admin' });
    }
    
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const login = async (password: string, rememberMe: boolean = false): Promise<boolean> => {
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
      
      // Set expiration time based on remember me option
      const expirationTime = rememberMe 
        ? Date.now() + (20 * 24 * 60 * 60 * 1000) // 20 days
        : Date.now() + (24 * 60 * 60 * 1000); // 1 day
      localStorage.setItem('kbLoginExpiry', expirationTime.toString());
      
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
      
      // Set expiration time based on remember me option
      const expirationTime = rememberMe 
        ? Date.now() + (20 * 24 * 60 * 60 * 1000) // 20 days
        : Date.now() + (24 * 60 * 60 * 1000); // 1 day
      localStorage.setItem('kbLoginExpiry', expirationTime.toString());
      
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
    localStorage.removeItem('kbLoginExpiry');
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

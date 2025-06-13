
import React, { createContext, useState, useContext, useEffect } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage on initial load
    const authStatus = localStorage.getItem('kbAuth');
    const adminStatus = localStorage.getItem('kbAdmin');
    const loginExpiry = localStorage.getItem('kbLoginExpiry');
    const userId = localStorage.getItem('kbUserId');
    
    console.log('Auth initialization - authStatus:', authStatus, 'loginExpiry:', loginExpiry);
    
    // Check if login has expired
    if (loginExpiry && Date.now() > parseInt(loginExpiry)) {
      // Login has expired, clear all auth data
      console.log('Login expired, clearing auth data');
      localStorage.removeItem('kbAuth');
      localStorage.removeItem('kbAdmin');
      localStorage.removeItem('kbUserId');
      localStorage.removeItem('kbLoginExpiry');
      return;
    }
    
    if (authStatus === 'true' && userId && loginExpiry) {
      console.log('Restoring session for user:', userId);
      setIsAuthenticated(true);
      setUser({ id: userId });
      
      if (adminStatus === 'true') {
        setIsAdmin(true);
      }
    }
  }, []);

  const login = async (password: string, rememberMe: boolean = false): Promise<boolean> => {
    console.log('Login attempt with rememberMe:', rememberMe);
    
    // In a real application, this would be a server request
    // For demo purposes, we'll use simple hardcoded passwords
    if (password === 'qazWSX86+!') {
      const userId = 'admin-' + Date.now();
      const expirationTime = rememberMe 
        ? Date.now() + (20 * 24 * 60 * 60 * 1000) // 20 days
        : Date.now() + (24 * 60 * 60 * 1000); // 1 day
      
      console.log('Admin login successful, expiration:', new Date(expirationTime));
      
      localStorage.setItem('kbUserId', userId);
      localStorage.setItem('kbAuth', 'true');
      localStorage.setItem('kbAdmin', 'true');
      localStorage.setItem('kbLoginExpiry', expirationTime.toString());
      
      setUser({ id: userId });
      setIsAuthenticated(true);
      setIsAdmin(true);
      
      toast.success('Logged in as administrator');
      return true;
    } else {
      toast.error('Invalid password');
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem('kbAuth');
    localStorage.removeItem('kbAdmin');
    localStorage.removeItem('kbUserId');
    localStorage.removeItem('kbLoginExpiry');
    toast.info('Logged out successfully');
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

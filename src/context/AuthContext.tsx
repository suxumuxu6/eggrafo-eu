
import React, { createContext, useContext, ReactNode } from "react";
import { AuthContextType } from "@/types/auth";
import { AuthService } from "@/services/authService";
import { useAuthState } from "@/hooks/useAuthState";

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session, isAdmin, loading, setLoading } = useAuthState();

  // Enhanced sign in with input validation
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    setLoading(true);
    try {
      return await AuthService.signIn(email, password, captchaToken);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sign up with input validation
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      return await AuthService.signUp(email, password);
    } finally {
      setLoading(false);
    }
  };

  // Sign Out with cleanup
  const signOut = async () => {
    await AuthService.signOut();
  };

  const contextValue = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
  };

  console.log('Auth context value:', {
    hasUser: !!contextValue.user,
    hasSession: !!contextValue.session,
    isAuthenticated: contextValue.isAuthenticated,
    isAdmin: contextValue.isAdmin,
    loading: contextValue.loading
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

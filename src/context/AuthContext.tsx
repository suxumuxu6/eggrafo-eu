
import React, { createContext, useContext, ReactNode } from "react";
import { AuthContextType } from "@/types/auth";
import { AuthService } from "@/services/authService";
import { useAuthState } from "@/hooks/useAuthState";

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session, isAdmin, loading, setLoading } = useAuthState();

  // Simplified sign in
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    setLoading(true);
    try {
      console.log('SignIn attempt for:', email);
      const result = await AuthService.signIn(email, password, captchaToken);
      console.log('SignIn result:', result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Simplified sign up
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('SignUp attempt for:', email);
      return await AuthService.signUp(email, password);
    } finally {
      setLoading(false);
    }
  };

  // Simplified sign out
  const signOut = async () => {
    console.log('SignOut initiated');
    setLoading(true);
    try {
      await AuthService.signOut();
    } finally {
      setLoading(false);
    }
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
    loading: contextValue.loading,
    userId: contextValue.user?.id
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


import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { verifyAdminAuthentication } from "@/utils/authSecurity";

// Types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Enhanced admin check with security measures
  const checkAdmin = async (uid: string | undefined) => {
    console.log('Checking admin for user:', uid);
    setIsAdmin(false);
    
    if (!uid) {
      console.log('No user ID provided, not admin');
      return;
    }
    
    try {
      const authResult = await verifyAdminAuthentication();
      console.log('Admin verification result:', authResult);
      
      if (authResult.isValid && authResult.isAdmin) {
        console.log('User is admin');
        setIsAdmin(true);
      } else {
        console.log('User is not admin:', authResult.error);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error in admin verification:', err);
      setIsAdmin(false);
    }
  };

  // Sync profile table (id + email) if not exists
  const syncProfile = async (user: User) => {
    try {
      await supabase
        .from("profiles")
        .upsert([{ id: user.id, email: user.email }], { onConflict: "id" });
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  };

  // Auth state listener with enhanced security
  useEffect(() => {
    console.log('Setting up auth listener');
    setLoading(true);
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session: !!session, userId: session?.user?.id });
      
      setSession(session);
      const loggedUser = session?.user ?? null;
      setUser(loggedUser);
      
      if (loggedUser && session) {
        console.log('User logged in, syncing profile and checking admin');
        await syncProfile(loggedUser);
        
        // Use timeout to prevent hanging on admin check
        setTimeout(() => {
          checkAdmin(loggedUser.id);
        }, 0);
      } else {
        console.log('No user/session, resetting admin status');
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    // Check active session at load with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session: !!session, error, userId: session?.user?.id });
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Initial session found, syncing profile and checking admin');
          await syncProfile(session.user);
          await checkAdmin(session.user.id);
        } else {
          console.log('No initial session found');
          setIsAdmin(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in with input validation
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    console.log('Attempting sign in for:', email);
    
    // Basic input validation
    if (!email || !password) {
      toast.error("Email and password are required");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message || "Login failed");
        return false;
      }
      
      console.log('Sign in successful');
      toast.success("Συνδεθήκατε!");
      return true;
    } catch (error: any) {
      console.error('Sign in exception:', error);
      toast.error("Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sign up with input validation
  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up for:', email);
    
    // Enhanced input validation
    if (!email || !password) {
      toast.error("Email and password are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { emailRedirectTo: redirectTo }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message || "Sign up failed");
        return false;
      }
      
      console.log('Sign up successful');
      toast.success("Ελέγξτε το email σας για επιβεβαίωση.");
      return true;
    } catch (error: any) {
      console.error('Sign up exception:', error);
      toast.error("Sign up failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign Out with cleanup
  const signOut = async () => {
    console.log('Signing out');
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setUser(null);
      setSession(null);
      toast.info("Αποσυνδεθήκατε");
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error("Sign out failed");
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

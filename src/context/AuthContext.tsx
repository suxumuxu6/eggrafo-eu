
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Helper to check admin in DB
  const checkAdmin = async (uid: string | undefined) => {
    console.log('Checking admin for user:', uid);
    setIsAdmin(false);
    if (!uid) {
      console.log('No user ID provided, not admin');
      return;
    }
    
    try {
      let { data, error } = await supabase.rpc("is_admin", { _user_id: uid });
      console.log('Admin check result:', { data, error, uid });
      if (!error && data === true) {
        console.log('User is admin');
        setIsAdmin(true);
      } else {
        console.log('User is not admin or error occurred:', error);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
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

  // Auth state listener
  useEffect(() => {
    console.log('Setting up auth listener');
    setLoading(true);
    
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session: !!session, userId: session?.user?.id });
      
      setSession(session);
      const loggedUser = session?.user ?? null;
      setUser(loggedUser);
      
      if (loggedUser && session) {
        console.log('User logged in, syncing profile and checking admin');
        await syncProfile(loggedUser);
        await checkAdmin(loggedUser.id);
      } else {
        console.log('No user/session, resetting admin status');
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    // Check active session at load
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
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
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Sign In
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    console.log('Attempting sign in for:', email);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || "Login failed");
      return false;
    }
    console.log('Sign in successful');
    toast.success("Συνδεθήκατε!");
    return true;
  };

  // Sign Up
  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up for:', email);
    setLoading(true);
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    setLoading(false);
    if (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Sign up failed");
      return false;
    }
    console.log('Sign up successful');
    toast.success("Ελέγξτε το email σας για επιβεβαίωση.");
    return true;
  };

  // Sign Out
  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    toast.info("Αποσυνδεθήκατε");
    // Redirect to home page
    window.location.href = '/';
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

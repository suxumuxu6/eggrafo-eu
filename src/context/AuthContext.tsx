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
    setIsAdmin(false);
    if (!uid) return;
    let { data, error } = await supabase.rpc("is_admin", { _user_id: uid });
    if (!error && data === true) setIsAdmin(true);
  };

  // Sync profile table (id + email) if not exists
  const syncProfile = async (user: User) => {
    await supabase
      .from("profiles")
      .upsert([{ id: user.id, email: user.email }], { onConflict: "id" });
  };

  // Auth state listener
  useEffect(() => {
    setLoading(true);
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const loggedUser = session?.user ?? null;
      setUser(loggedUser);
      if (loggedUser) {
        syncProfile(loggedUser);
        checkAdmin(loggedUser.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Check active session at load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
        checkAdmin(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Sign In
  // Accept captchaToken parameter and pass to supabase.auth.signInWithPassword
  const signIn = async (email: string, password: string, captchaToken?: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Login failed");
      return false;
    }
    toast.success("Συνδεθήκατε!");
    return true;
  };

  // Sign Up
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/`; // Needed by Supabase!
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Sign up failed");
      return false;
    }
    toast.success("Ελέγξτε το email σας για επιβεβαίωση.");
    return true;
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    toast.info("Αποσυνδεθήκατε");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
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

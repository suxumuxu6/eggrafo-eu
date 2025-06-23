
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateEmail, sanitizeEmail } from "@/utils/inputValidation";

export class AuthService {
  static async signIn(email: string, password: string, captchaToken?: string): Promise<boolean> {
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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message || "Login failed");
        return false;
      }
      
      console.log('Sign in successful');
      return true;
    } catch (error: any) {
      console.error('Sign in exception:', error);
      toast.error("Login failed");
      return false;
    }
  }

  static async signUp(email: string, password: string): Promise<boolean> {
    console.log('Attempting sign up for:', email);
    
    // Enhanced input validation
    if (!email || !password) {
      toast.error("Email and password are required");
      return false;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: sanitizeEmail(email),
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
    }
  }

  static async signOut(): Promise<void> {
    console.log('Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error("Sign out failed");
      } else {
        toast.info("Αποσυνδεθήκατε");
        // Force page reload to clear all state
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error) {
      console.error('Sign out exception:', error);
      toast.error("Sign out failed");
    }
  }

  static async syncProfile(user: any): Promise<void> {
    try {
      await supabase
        .from("profiles")
        .upsert([{ id: user.id, email: user.email }], { onConflict: "id" });
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  }
}

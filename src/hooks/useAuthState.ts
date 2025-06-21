
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdminAuthentication } from "@/utils/authSecurity";
import { AuthService } from "@/services/authService";
import { AuthState } from "@/types/auth";

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true
  });

  // Enhanced admin check with security measures
  const checkAdmin = async (uid: string | undefined) => {
    console.log('Checking admin for user:', uid);
    setAuthState(prev => ({ ...prev, isAdmin: false }));
    
    if (!uid) {
      console.log('No user ID provided, not admin');
      return;
    }
    
    try {
      const authResult = await verifyAdminAuthentication();
      console.log('Admin verification result:', authResult);
      
      if (authResult.isValid && authResult.isAdmin) {
        console.log('User is admin');
        setAuthState(prev => ({ ...prev, isAdmin: true }));
      } else {
        console.log('User is not admin:', authResult.error);
        setAuthState(prev => ({ ...prev, isAdmin: false }));
      }
    } catch (err) {
      console.error('Error in admin verification:', err);
      setAuthState(prev => ({ ...prev, isAdmin: false }));
    }
  };

  // Auth state listener with enhanced security
  useEffect(() => {
    console.log('Setting up auth listener');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session: !!session, userId: session?.user?.id });
      
      const loggedUser = session?.user ?? null;
      setAuthState(prev => ({
        ...prev,
        session,
        user: loggedUser
      }));
      
      if (loggedUser && session) {
        console.log('User logged in, syncing profile and checking admin');
        await AuthService.syncProfile(loggedUser);
        
        // Use timeout to prevent hanging on admin check
        setTimeout(() => {
          checkAdmin(loggedUser.id);
        }, 0);
      } else {
        console.log('No user/session, resetting admin status');
        setAuthState(prev => ({ ...prev, isAdmin: false }));
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
    });

    // Check active session at load with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session: !!session, error, userId: session?.user?.id });
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null
        }));
        
        if (session?.user) {
          console.log('Initial session found, syncing profile and checking admin');
          await AuthService.syncProfile(session.user);
          await checkAdmin(session.user.id);
        } else {
          console.log('No initial session found');
          setAuthState(prev => ({ ...prev, isAdmin: false }));
        }
        
        setAuthState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    setLoading: (loading: boolean) => setAuthState(prev => ({ ...prev, loading }))
  };
};

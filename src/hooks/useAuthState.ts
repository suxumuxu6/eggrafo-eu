
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

  const [initialized, setInitialized] = useState(false);

  // Enhanced admin check with better error handling
  const checkAdmin = async (uid: string | undefined) => {
    if (!uid) {
      console.log('No user ID provided, not admin');
      setAuthState(prev => ({ ...prev, isAdmin: false }));
      return;
    }
    
    try {
      console.log('Checking admin for user:', uid);
      const authResult = await verifyAdminAuthentication(3000); // Reduced timeout
      console.log('Admin verification result:', authResult);
      
      setAuthState(prev => ({ 
        ...prev, 
        isAdmin: authResult.isValid && authResult.isAdmin 
      }));
    } catch (err) {
      console.error('Error in admin verification:', err);
      setAuthState(prev => ({ ...prev, isAdmin: false }));
    }
  };

  // Auth state listener with better control flow
  useEffect(() => {
    let mounted = true;
    
    console.log('Setting up auth listener');
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', { event, session: !!session, userId: session?.user?.id });
      
      const loggedUser = session?.user ?? null;
      
      // Update basic auth state immediately
      setAuthState(prev => ({
        ...prev,
        session,
        user: loggedUser,
        loading: false
      }));
      
      // Handle user-specific actions
      if (loggedUser && session) {
        console.log('User logged in, syncing profile');
        try {
          await AuthService.syncProfile(loggedUser);
          
          // Check admin status with timeout to prevent hanging
          setTimeout(() => {
            if (mounted) {
              checkAdmin(loggedUser.id);
            }
          }, 100);
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      } else {
        console.log('No user/session, resetting admin status');
        setAuthState(prev => ({ ...prev, isAdmin: false }));
      }
      
      setInitialized(true);
    });

    // Check active session at load with better error handling
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          setInitialized(true);
          return;
        }
        
        console.log('Initial session check:', { session: !!session, userId: session?.user?.id });
        
        if (session?.user && mounted) {
          console.log('Initial session found, syncing profile');
          try {
            await AuthService.syncProfile(session.user);
            await checkAdmin(session.user.id);
          } catch (error) {
            console.error('Error in initial auth setup:', error);
          }
        }
        
        if (mounted) {
          setAuthState(prev => ({ 
            ...prev, 
            session,
            user: session?.user ?? null,
            isAdmin: session?.user ? prev.isAdmin : false,
            loading: false 
          }));
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
          setInitialized(true);
        }
      }
    };

    // Only initialize if not already done
    if (!initialized) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [initialized]);

  return {
    ...authState,
    setLoading: (loading: boolean) => setAuthState(prev => ({ ...prev, loading }))
  };
};

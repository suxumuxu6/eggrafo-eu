
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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

  // Simplified admin check without recursive calls
  const checkAdmin = async (uid: string | undefined) => {
    if (!uid) {
      console.log('No user ID provided, not admin');
      setAuthState(prev => ({ ...prev, isAdmin: false }));
      return;
    }
    
    try {
      console.log('Checking admin for user:', uid);
      
      // Direct database query for admin check
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
        .eq('role', 'admin')
        .single();
      
      const isAdmin = !error && data?.role === 'admin';
      console.log('Admin check result:', isAdmin);
      
      setAuthState(prev => ({ 
        ...prev, 
        isAdmin
      }));
    } catch (err) {
      console.error('Error in admin verification:', err);
      setAuthState(prev => ({ ...prev, isAdmin: false }));
    }
  };

  // Simplified auth state listener
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
      
      // Handle admin check separately to avoid blocking the UI
      if (loggedUser && session) {
        console.log('User logged in, checking admin status');
        setTimeout(() => checkAdmin(loggedUser.id), 100);
      } else {
        console.log('No user/session, resetting admin status');
        setAuthState(prev => ({ ...prev, isAdmin: false }));
      }
      
      setInitialized(true);
    });

    // Check active session at load
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, loading: false, isAdmin: false }));
          setInitialized(true);
          return;
        }
        
        console.log('Initial session check:', { session: !!session, userId: session?.user?.id });
        
        if (session?.user && mounted) {
          console.log('Initial session found, checking admin');
          setTimeout(() => checkAdmin(session.user.id), 100);
        }
        
        if (mounted) {
          setAuthState(prev => ({ 
            ...prev, 
            session,
            user: session?.user ?? null,
            loading: false 
          }));
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false, isAdmin: false }));
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

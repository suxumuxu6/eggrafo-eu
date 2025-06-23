
import { supabase } from "@/integrations/supabase/client";

export interface AuthSecurityResult {
  isValid: boolean;
  isAdmin: boolean;
  error?: string;
}

export const verifyAdminAuthentication = async (timeout: number = 5000): Promise<AuthSecurityResult> => {
  try {
    console.log('🔐 Starting admin authentication verification...');

    // Get session with timeout
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return { isValid: false, isAdmin: false, error: 'Session error' };
    }

    if (!session || !session.user) {
      console.log('❌ No active session found');
      return { isValid: false, isAdmin: false, error: 'No active session' };
    }

    console.log('✅ Valid session found for user:', session.user.id);

    // Check admin status with direct RPC call
    try {
      console.log('🔍 Checking admin status via RPC...');
      
      const { data: isAdminResult, error: adminError } = await supabase.rpc("is_admin", { 
        _user_id: session.user.id 
      });
      
      if (adminError) {
        console.error('❌ Admin check RPC error:', adminError);
        // Try alternative method - direct query
        console.log('🔄 Trying direct user_roles query...');
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();
          
        if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected for non-admins
          console.error('❌ Direct role query error:', roleError);
          return { isValid: true, isAdmin: false, error: 'Admin verification failed' };
        }
        
        const isAdmin = !roleError && roleData?.role === 'admin';
        console.log('✅ Direct query result - isAdmin:', isAdmin);
        
        return { 
          isValid: true, 
          isAdmin,
          error: isAdmin ? undefined : 'User is not an admin'
        };
      }

      console.log('✅ RPC admin check result:', isAdminResult);
      
      return { 
        isValid: true, 
        isAdmin: Boolean(isAdminResult),
        error: isAdminResult ? undefined : 'User is not an admin'
      };
    } catch (adminCheckError) {
      console.error('❌ Admin check exception:', adminCheckError);
      return { isValid: true, isAdmin: false, error: 'Admin verification exception' };
    }
  } catch (error: any) {
    console.error('❌ Authentication security check failed:', error);
    return { 
      isValid: false, 
      isAdmin: false, 
      error: error.message || 'Authentication failed' 
    };
  }
};

export const requireAdminAuth = async (): Promise<boolean> => {
  try {
    const result = await verifyAdminAuthentication(5000);
    console.log('requireAdminAuth result:', result);
    return result.isValid && result.isAdmin;
  } catch (error) {
    console.error('requireAdminAuth error:', error);
    return false;
  }
};

// Rate limiting utility
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier);

  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userRequests.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  userRequests.count++;
  return true;
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken && token.length > 10;
};


import { supabase } from "@/integrations/supabase/client";

export interface AuthSecurityResult {
  isValid: boolean;
  isAdmin: boolean;
  error?: string;
}

export const verifyAdminAuthentication = async (timeout: number = 5000): Promise<AuthSecurityResult> => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<AuthSecurityResult>((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout')), timeout);
    });

    // Create the authentication check promise
    const authPromise = (async (): Promise<AuthSecurityResult> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return { isValid: false, isAdmin: false, error: 'Session error' };
      }

      if (!session || !session.user) {
        return { isValid: false, isAdmin: false, error: 'No active session' };
      }

      // Check admin status with proper error handling
      try {
        const { data: isAdminResult, error: adminError } = await supabase.rpc("is_admin", { 
          _user_id: session.user.id 
        });
        
        if (adminError) {
          console.error('Admin check error:', adminError);
          return { isValid: true, isAdmin: false, error: 'Admin verification failed' };
        }

        return { 
          isValid: true, 
          isAdmin: Boolean(isAdminResult),
          error: isAdminResult ? undefined : 'User is not an admin'
        };
      } catch (adminCheckError) {
        console.error('Admin check exception:', adminCheckError);
        return { isValid: true, isAdmin: false, error: 'Admin verification exception' };
      }
    })();

    // Race between timeout and auth check
    return await Promise.race([authPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('Authentication security check failed:', error);
    return { 
      isValid: false, 
      isAdmin: false, 
      error: error.message || 'Authentication failed' 
    };
  }
};

export const requireAdminAuth = async (): Promise<boolean> => {
  const result = await verifyAdminAuthentication();
  return result.isValid && result.isAdmin;
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

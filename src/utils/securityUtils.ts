
// Enhanced security utilities for input validation and protection
import { supabase } from "@/integrations/supabase/client";

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .substring(0, 1000); // Limit length
};

// Enhanced filename sanitization
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'unnamed_file';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe characters
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit filename length
};

// CSRF token management
const CSRF_TOKEN_KEY = 'csrf_token';

export const generateCSRFToken = (): string => {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15) +
                Date.now().toString(36);
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

export const getCSRFToken = (): string => {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCSRFToken();
  }
  return token;
};

export const validateCSRFToken = (token: string): boolean => {
  const sessionToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return token === sessionToken && token.length > 20;
};

// Rate limiting for client-side protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  action: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const key = `${action}_${window.location.hostname}`;
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxAttempts) {
    return false;
  }

  limit.count++;
  return true;
};

// Security event logging
export const logSecurityEvent = async (
  eventType: string, 
  details: Record<string, any> = {}
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('log_security_event', {
      event_type: eventType,
      details: details
    });
    
    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

// Enhanced password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα μικρό γράμμα');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα ειδικό χαρακτήρα');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Μόνο αρχεία PDF επιτρέπονται' };
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'Το αρχείο δεν μπορεί να υπερβαίνει τα 10MB' };
  }
  
  // Check filename
  const sanitizedName = sanitizeFilename(file.name);
  if (sanitizedName !== file.name) {
    return { isValid: false, error: 'Το όνομα του αρχείου περιέχει μη επιτρεπτούς χαρακτήρες' };
  }
  
  return { isValid: true };
};

// HTML encoding for safe display
export const encodeHTML = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Session security utilities
export const clearSecurityTokens = (): void => {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  // Clear any other security-related session data
};

export const isSecureContext = (): boolean => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

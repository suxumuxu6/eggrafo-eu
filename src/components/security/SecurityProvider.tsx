
import React, { useEffect } from 'react';
import { useSecurityEnforcement } from '@/hooks/useSecurityEnforcement';
import { generateCSRFToken, isSecureContext, logSecurityEvent } from '@/utils/securityUtils';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useSecurityEnforcement();

  useEffect(() => {
    // Generate CSRF token on app start
    generateCSRFToken();

    // Check for secure context
    if (!isSecureContext()) {
      console.warn('Application is not running in a secure context (HTTPS)');
      logSecurityEvent('insecure_context_detected', {
        protocol: window.location.protocol,
        host: window.location.host
      });
    }

    // Set security headers via meta tags
    const setSecurityHeaders = () => {
      // Content Security Policy - Updated to include functions subdomain
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://vcxwikgasrttbngdygig.supabase.co https://vcxwikgasrttbngdygig.functions.supabase.co https://*.supabase.co;";
      document.head.appendChild(cspMeta);

      // X-Frame-Options
      const frameMeta = document.createElement('meta');
      frameMeta.httpEquiv = 'X-Frame-Options';
      frameMeta.content = 'DENY';
      document.head.appendChild(frameMeta);

      // X-Content-Type-Options
      const contentTypeMeta = document.createElement('meta');
      contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
      contentTypeMeta.content = 'nosniff';
      document.head.appendChild(contentTypeMeta);
    };

    setSecurityHeaders();

    // Log security provider initialization
    logSecurityEvent('security_provider_initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

  }, []);

  return <>{children}</>;
};

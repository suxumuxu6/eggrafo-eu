
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent, checkRateLimit } from '@/utils/securityUtils';

export const useSecurityEnforcement = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Monitor for suspicious activities
    const handleSecurityEvent = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Log suspicious form submissions
      if (event.type === 'submit' && target.tagName === 'FORM') {
        if (!checkRateLimit('form_submit', 10, 60000)) {
          event.preventDefault();
          logSecurityEvent('rate_limit_exceeded', {
            action: 'form_submit',
            url: window.location.href
          });
        }
      }
      
      // Log multiple failed login attempts
      if (target.closest('[data-testid="auth-form"]')) {
        if (!checkRateLimit('auth_attempt', 5, 300000)) { // 5 attempts per 5 minutes
          event.preventDefault();
          logSecurityEvent('auth_rate_limit_exceeded', {
            url: window.location.href,
            user_id: user?.id
          });
        }
      }
    };

    // Add security event listeners
    document.addEventListener('submit', handleSecurityEvent);
    
    // Log session start
    if (user) {
      logSecurityEvent('session_start', {
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      document.removeEventListener('submit', handleSecurityEvent);
    };
  }, [user]);

  // Session timeout monitoring
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (user) {
          logSecurityEvent('session_timeout', {
            user_id: user.id,
            duration: '30_minutes'
          });
          // Force logout on timeout
          window.location.reload();
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Reset timeout on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    if (user) {
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [user]);
};

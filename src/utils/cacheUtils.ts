
// Simplified cache utilities to prevent loading issues
export const clearCache = (): void => {
  try {
    // Clear browser storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      
      // Clear specific items that might cause issues
      const keysToRemove = [
        'documents-cache',
        'supabase.auth.token',
        'sb-auth-token'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });
      
      // Clear any other auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore errors
          }
        }
      });
    }
    
    console.log('Cache cleared successfully');
  } catch (e) {
    console.error('Cache clear failed:', e);
  }
};

// Simplified cleanup
export const cleanupCache = async (): Promise<void> => {
  return Promise.resolve();
};

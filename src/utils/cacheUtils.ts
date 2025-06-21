
// Simplified cache utilities without complex caching that can cause issues
export const clearCache = (): void => {
  try {
    // Clear browser storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('documents-cache');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear any other auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Force reload to ensure clean state
    window.location.reload();
  } catch (e) {
    console.error('Cache clear failed:', e);
    window.location.reload();
  }
};

// Remove complex cache cleanup that was causing issues
export const cleanupCache = async (): Promise<void> => {
  // Do nothing - simplified approach
  return Promise.resolve();
};

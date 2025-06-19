
const CACHE_VERSION = 'v6'; // Incremented to force cache refresh
const CACHE_NAME = `eggrafo-cache-${CACHE_VERSION}`;

export const cleanupCache = async (): Promise<void> => {
  // Make cache cleanup completely non-blocking and fast
  setTimeout(async () => {
    try {
      // Quick 2-second timeout for all cache operations
      const cleanupPromise = Promise.race([
        performCacheCleanup(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cache cleanup timeout')), 2000)
        )
      ]);
      
      await cleanupPromise;
      console.log('🧹 Background cache cleanup completed');
    } catch (e) {
      console.log('Cache cleanup skipped (non-critical):', e);
    }
  }, 0); // Run asynchronously after current execution
};

const performCacheCleanup = async () => {
  // Clear all old caches aggressively
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('eggrafo-cache-') && name !== CACHE_NAME
    );
    
    if (oldCaches.length > 0) {
      await Promise.allSettled(oldCaches.map(name => caches.delete(name)));
      console.log('🧹 Deleted old caches:', oldCaches);
    }
  }

  // Clear all problematic browser storage more aggressively
  if ('sessionStorage' in window) {
    try {
      // Test if sessionStorage is accessible
      const testKey = 'cache-test-' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      
      // Clear ALL session storage to avoid any conflicts
      sessionStorage.clear();
      console.log('🧹 Cleared all sessionStorage');
    } catch (e) {
      console.log('SessionStorage not accessible or already cleared');
    }
  }

  // Clear specific localStorage items that cause issues
  if ('localStorage' in window) {
    try {
      const problematicKeys = [
        'supabase.auth.token',
        'sb-auth-token', 
        'documents-cache',
        'auth-session-cache',
        'upload_form_data' // Clear any stuck upload form data
      ];
      
      problematicKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal failures
        }
      });
      
      console.log('🧹 Cleared problematic localStorage keys');
    } catch (e) {
      console.log('localStorage cleanup failed:', e);
    }
  }
};

export const clearCache = (): void => {
  console.log('🧹 Manual cache clear requested');
  
  try {
    // Force clear browser storage
    if ('sessionStorage' in window) {
      sessionStorage.clear();
    }
    
    if ('localStorage' in window) {
      // Clear specific keys that might be causing upload issues
      const keysToRemove = ['upload_form_data', 'supabase.auth.token', 'sb-auth-token'];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore failures
        }
      });
    }
    
    // Clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.startsWith('eggrafo-cache-')) {
            caches.delete(name);
          }
        });
      });
    }
    
    console.log('🧹 Manual cache clear completed');
    
    // Force page reload after cache clear
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (e) {
    console.error('Manual cache clear failed:', e);
    // Still try to reload the page
    window.location.reload();
  }
};

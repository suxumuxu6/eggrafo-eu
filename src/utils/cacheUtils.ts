
const CACHE_VERSION = 'v5'; // Incremented to force cache refresh
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
  // Only clean truly problematic data, keep everything else
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('eggrafo-cache-') && name !== CACHE_NAME
    );
    
    if (oldCaches.length > 0) {
      await Promise.allSettled(oldCaches.map(name => caches.delete(name)));
    }
  }

  // Clear problematic browser storage
  if ('sessionStorage' in window) {
    try {
      // Test if sessionStorage is accessible
      const testKey = 'cache-test-' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      
      // If accessible, clean specific problematic keys
      const keysToCheck = Object.keys(sessionStorage);
      keysToCheck.forEach(key => {
        if (key.startsWith('temp-') || 
            key.startsWith('cache-') || 
            key.includes('supabase-auth-token') ||
            key.includes('sb-auth-token')) {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignore individual removal failures
          }
        }
      });
    } catch (e) {
      // If sessionStorage is corrupted, try to clear it completely
      try {
        sessionStorage.clear();
        console.log('🧹 Cleared corrupted sessionStorage');
      } catch (clearError) {
        console.log('Could not clear sessionStorage:', clearError);
      }
    }
  }

  // Clear potentially problematic localStorage items
  if ('localStorage' in window) {
    try {
      const problematicKeys = [
        'supabase.auth.token',
        'sb-auth-token', 
        'documents-cache',
        'auth-session-cache'
      ];
      
      problematicKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal failures
        }
      });
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

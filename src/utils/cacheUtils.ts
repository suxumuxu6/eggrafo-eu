const CACHE_VERSION = 'v7'; // Incremented for new caching strategy
const CACHE_NAME = `eggrafo-cache-${CACHE_VERSION}`;

export const cleanupCache = async (): Promise<void> => {
  // Make cache cleanup completely non-blocking and fast
  setTimeout(async () => {
    try {
      // Quick 1-second timeout for all cache operations
      const cleanupPromise = Promise.race([
        performCacheCleanup(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cache cleanup timeout')), 1000)
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
  // Implement smart caching strategy
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

  // Only clear problematic storage items, keep useful ones
  if ('sessionStorage' in window) {
    try {
      // Clear only authentication-related items that might cause issues
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth-token') || key.includes('temp-session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('🧹 Cleaned problematic session storage');
    } catch (e) {
      console.log('SessionStorage cleanup skipped');
    }
  }

  // Selective localStorage cleanup
  if ('localStorage' in window) {
    try {
      const problematicKeys = [
        'supabase.auth.token',
        'sb-auth-token', 
        'auth-session-cache'
      ];
      
      problematicKeys.forEach(key => {
        try {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignore individual removal failures
        }
      });
      
      console.log('🧹 Cleaned problematic localStorage keys');
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
    }, 100);
    
  } catch (e) {
    console.error('Manual cache clear failed:', e);
    // Still try to reload the page
    window.location.reload();
  }
};

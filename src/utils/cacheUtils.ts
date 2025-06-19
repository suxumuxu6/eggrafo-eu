const CACHE_VERSION = 'v4';
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

  // Only remove corrupted session data, not all
  if ('sessionStorage' in window) {
    try {
      const testKey = 'cache-test-' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch (e) {
      // Storage is full or corrupted, clear only non-essential items
      try {
        const keysToCheck = Object.keys(sessionStorage);
        keysToCheck.forEach(key => {
          if (key.startsWith('temp-') || key.startsWith('cache-')) {
            try {
              sessionStorage.removeItem(key);
            } catch (e) {
              // Ignore individual removal failures
            }
          }
        });
      } catch (e) {
        // Ignore cleanup failures
      }
    }
  }
};

export const clearCache = (): void => {
  console.log('🧹 Cache clear requested (minimal impact)');
  // Don't actually clear anything critical, just log
};

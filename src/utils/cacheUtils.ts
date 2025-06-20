
const CACHE_VERSION = 'v8'; // Simplified caching strategy
const CACHE_NAME = `eggrafo-cache-${CACHE_VERSION}`;

export const cleanupCache = async (): Promise<void> => {
  // Run cache cleanup asynchronously without blocking
  setTimeout(async () => {
    try {
      // Simple cache cleanup - only remove old cache versions
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('eggrafo-cache-') && name !== CACHE_NAME
        );
        
        if (oldCaches.length > 0) {
          await Promise.allSettled(oldCaches.map(name => caches.delete(name)));
        }
      }
    } catch (e) {
      // Silent fail - non-critical operation
    }
  }, 2000); // Delay to not block initial load
};

export const clearCache = (): void => {
  try {
    // Quick cache clear for manual requests
    if ('sessionStorage' in window) {
      sessionStorage.clear();
    }
    
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.startsWith('eggrafo-cache-')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Force reload after cache clear
    window.location.reload();
  } catch (e) {
    // Fallback to simple reload
    window.location.reload();
  }
};

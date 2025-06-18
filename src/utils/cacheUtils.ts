const CACHE_VERSION = 'v3';
const CACHE_NAME = `eggrafo-cache-${CACHE_VERSION}`;

export const cleanupCache = async (): Promise<void> => {
  try {
    // Quick timeout for cache operations to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache cleanup timeout')), 3000);
    });

    const cleanupPromise = (async () => {
      // Only clear old cache versions, not all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('eggrafo-cache-') && name !== CACHE_NAME
        );
        
        await Promise.all(oldCaches.map(name => caches.delete(name)));
      }

      // Only clean corrupted session data, not all session data
      if ('sessionStorage' in window) {
        try {
          const sessionKeys = Object.keys(sessionStorage);
          sessionKeys.forEach(key => {
            if (key.startsWith('supabase')) {
              try {
                const data = sessionStorage.getItem(key);
                if (data) {
                  JSON.parse(data); // Test if data is valid JSON
                }
              } catch (e) {
                console.log(`Removing corrupted session data: ${key}`);
                sessionStorage.removeItem(key);
              }
            }
          });
        } catch (e) {
          console.log('Could not clean session storage:', e);
        }
      }

      // Clean only problematic localStorage entries, keep important ones
      if ('localStorage' in window) {
        try {
          const keysToKeep = ['donatedDocs', 'upload_form_data'];
          const allKeys = Object.keys(localStorage);
          allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
              try {
                const data = localStorage.getItem(key);
                if (data && key.startsWith('supabase')) {
                  JSON.parse(data); // Test if data is valid JSON
                }
              } catch (e) {
                console.log(`Removing corrupted localStorage data: ${key}`);
                localStorage.removeItem(key);
              }
            }
          });
        } catch (e) {
          console.log('Could not clean localStorage:', e);
        }
      }
    })();

    await Promise.race([cleanupPromise, timeoutPromise]);
    console.log('🧹 Cache cleanup completed successfully');
  } catch (e) {
    console.log('Cache cleanup error (non-critical):', e);
  }
};

export const clearCache = (): void => {
  // Only unregister stuck service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        if (registration.installing || registration.waiting) {
          registration.unregister();
        }
      });
    });
  }
  
  console.log('🧹 Cache cleared (selective)');
};

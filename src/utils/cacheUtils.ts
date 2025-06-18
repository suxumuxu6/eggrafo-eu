const CACHE_VERSION = 'v2';
const CACHE_NAME = `eggrafo-cache-${CACHE_VERSION}`;

export const cleanupCache = async (): Promise<void> => {
  try {
    // Clear old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('eggrafo-cache-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );

    // Clear corrupted session data
    try {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        try {
          const data = sessionStorage.getItem(key);
          if (data && key.startsWith('supabase')) {
            JSON.parse(data); // Test if data is valid JSON
          }
        } catch (e) {
          console.log(`Removing corrupted session data: ${key}`);
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.log('Could not clean session storage:', e);
    }

    // Clear problematic localStorage entries (keep important ones)
    try {
      const keysToKeep = ['donatedDocs'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
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

    // Handle stuck service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          // Only unregister if it's causing issues
          if (registration.installing || registration.waiting) {
            registration.unregister();
          }
        });
      });
    }

    console.log('🧹 Automatic cache cleanup completed');
  } catch (e) {
    console.log('Cache cleanup error:', e);
  }
};

export const clearCache = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
  
  // Clear localStorage data that might be causing issues
  try {
    const keysToKeep = ['donatedDocs']; // Keep important data
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 Cache cleared');
  } catch (e) {
    console.log('Could not clear localStorage:', e);
  }
};

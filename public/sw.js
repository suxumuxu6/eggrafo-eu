
// Simplified service worker without aggressive caching
self.addEventListener('install', function(event) {
  console.log('SW: Install event');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('SW: Activate event');
  // Clear all caches on activation
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('SW: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Always fetch from network, no caching
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response('Network error', { status: 503 });
    })
  );
});

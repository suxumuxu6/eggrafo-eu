
const CACHE_NAME = 'eggrafo-cache-v8';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css'
];

self.addEventListener('install', function(event) {
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache preload failed:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  // Take control immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Simple cache strategy - cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
      .catch(function() {
        // Return a basic fallback for failed requests
        return new Response('Offline', { status: 503 });
      })
  );
});

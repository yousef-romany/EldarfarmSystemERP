// Choose a cache name
const CACHE_NAME = 'mawashi-manager-v1';
// List the files to precache
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Listener for the install event - precaches our assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Listener for the activate event - cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listener for the fetch event - serves assets from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Serve from cache if found
      if (response) {
        return response;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Optional: Cache the new response
        // Clone the response because it's a stream and can only be consumed once
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                // We will cache only GET requests for pages and assets
                if (event.request.method === 'GET' && !event.request.url.includes('/api/')) {
                    cache.put(event.request, responseToCache);
                }
            });
        }
        return networkResponse;
      });
    }).catch(() => {
        // If both fail (e.g., offline and not in cache), you can return a fallback page
        // For now, we'll just let the fetch fail.
    })
  );
});

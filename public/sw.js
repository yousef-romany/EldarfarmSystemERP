// v2: Network-first strategy with dynamic caching and cleanup

const CACHE_NAME = 'mawashi-manager-cache-v2';
const DYNAMIC_CACHE_NAME = 'mawashi-manager-dynamic-v2';

// Essential assets to cache on install
const urlsToCache = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/favicon.ico',
];

// 1. Install Service Worker and cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching static assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache static assets:', err);
      })
  );
});

// 2. Activate Service Worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open clients
  );
});

// 3. Fetch event: Network-first for navigation, Cache-first for other assets
self.addEventListener('fetch', event => {
  const { request } = event;

  // For navigation requests (HTML pages), use Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the fetch is successful, cache the new response
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // If the fetch fails, try to get it from the cache
          return caches.match(request).then(cachedResponse => {
            // If we have a cached version, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            // If nothing is in the cache, you could return a fallback page
            // return caches.match('/fallback.html'); 
            // For now, we just let the browser's default error page show.
            return new Response("You are offline and the page was not cached.", {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({ "Content-Type": "text/html" })
            });
          });
        })
    );
    return;
  }

  // For non-navigation requests (CSS, JS, images), use Cache-First
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).then(networkResponse => {
        // Cache the new resource for future use
        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME)
          .then(cache => {
            cache.put(request, responseToCache);
          });
        return networkResponse;
      });
    })
  );
});

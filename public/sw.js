const CACHE_NAME = 'cht-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/habit-tracker-engine.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event - Caching basic shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First, falling back to cache
self.addEventListener('fetch', (e) => {
  // Ignore API requests and non-GET requests so we don't cache database actions or syncs
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If response is valid, clone it and put in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, serve from cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the shell isn't cached, return a basic offline message or fallback
        });
      })
  );
});

// Kizuna Alert AI - Emergency Service Worker
const CACHE_NAME = 'kizuna-emergency-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/offline.html',
];

// Install: Cache emergency assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic briefing, cache-first for static offline pack
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // If requesting emergency offline guide or root when offline, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to cache valid GET responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/offline.html');
          if (fallback) return fallback;
          return caches.match('/');
        }
        return new Response('Emergency offline mode active', { status: 503, statusText: 'Offline' });
      })
  );
});

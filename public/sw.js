// Cemetery Map & Grave Locator - Service Worker for Offline Resilience
const CACHE_NAME = 'behesht-zahra-v1';
const STATIC_CACHE = `static-${CACHE_NAME}`;
const MAPS_CACHE = `maps-${CACHE_NAME}`;
const IMAGE_CACHE = `images-${CACHE_NAME}`;

// Static resources to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/favicon.ico'
];

// Service Worker Install State
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching Core App Shell Assets');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache assets missing or skipped in development:', err);
      });
    })
  );
});

// Service Worker Activation State
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith(CACHE_NAME) && 
              cacheName !== STATIC_CACHE && 
              cacheName !== MAPS_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Cleaning old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache Strategy Helper
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (like Firestore POSTs or WebSocket connections)
  if (request.method !== 'GET') {
    return;
  }

  // Skip Firebase auth token endpoint or dynamic queries if they bypass standard fetch
  if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('identitytoolkit')) {
    // Rely on Firestore persistent SDK offline cache
    return;
  }

  // 1. Navigation requests (load the SPA index.html shell offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 2. Google Maps API and Tiles Caching (Cache-First)
  // Cache Google Maps JS loader, tile images, static maps, and fonts
  const isGoogleMapsRequest = 
    url.hostname.includes('maps.googleapis.com') || 
    url.hostname.includes('maps.gstatic.com') || 
    url.hostname.includes('mts1.google.com') || 
    url.hostname.includes('mts0.google.com') ||
    url.hostname.includes('khms.google.com') ||
    url.hostname.includes('khms1.google.com') ||
    url.hostname.includes('ggpht.com');

  if (isGoogleMapsRequest) {
    event.respondWith(
      caches.open(MAPS_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response instantly and fetch fresh map resource in background
            fetch(request).then((networkResponse) => {
              if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Fetch from network and store in cache
          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
              const responseClone = networkResponse.clone();
              cache.put(request, responseClone);
            }
            return networkResponse;
          }).catch((err) => {
            console.warn('[SW] Offline Map Resource Request failed:', url.href);
            // Fallback for maps offline
            return new Response('Offline Map Connection Unavailable', { status: 503, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // 3. Image/Photo Cache Strategy (Cache-First)
  // Caches Unsplash profile pictures, grave images, or uploaded media
  const isImageRequest = 
    request.destination === 'image' || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg') || 
    url.pathname.endsWith('.webp') ||
    url.hostname.includes('images.unsplash.com');

  if (isImageRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Provide a generic local fallback image or SVG if unavailable
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#f5f5f4"/><text x="50%" y="50%" font-size="10" font-family="system-ui" fill="#a8a29e" dominant-baseline="middle" text-anchor="middle">آفلاین</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // 4. Default Local / Static assets (Stale-While-Revalidate)
  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || networkFetch;
      });
    })
  );
});

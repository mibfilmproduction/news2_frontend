// Service Worker for Mibnews
const CACHE_NAME = 'mibnews-cache-v2';
const OFFLINE_PAGE = '/offline.html';

// Resources we want to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/logo.jpeg',
  '/manifest.json',
  '/icons/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) return;
  
  // Skip API and admin requests (no caching)
  if (event.request.url.includes('/api/') || event.request.url.includes('/admin/')) {
    return;
  }

  // HTML navigations must be network-first so a deployment cannot remain
  // pinned to an old index.html that references removed hashed chunks.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from cache
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Network failed, serve offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // For image requests, serve a default image
            if (event.request.destination === 'image') {
              return caches.match('/placeholder.svg');
            }
            
            // Return nothing for other asset types
            return;
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

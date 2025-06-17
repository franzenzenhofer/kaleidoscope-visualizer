// Service Worker for offline PWA functionality
const CACHE_NAME = 'dream-kaleido-v1.3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/main.js',
  '/js/canvas.js',
  '/js/config.js',
  '/js/renderer.js',
  '/js/interaction.js',
  '/js/audio.js',
  '/js/audio-visual.js',
  '/js/animation.js',
  '/js/desktop-interactions.js',
  '/js/version.js',
  '/Dea_Fungorum_cut_fadeout.mp3',
  'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
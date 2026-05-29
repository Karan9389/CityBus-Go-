const CACHE_NAME = 'citybus-go-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/App.tsx',
  '/manifest.json',
  '/styles/globals.css'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.log('Service Worker: Cache failed', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // For navigation requests, always check network first for updates
          if (event.request.mode === 'navigate') {
            return fetch(event.request)
              .then((networkResponse) => {
                // Update cache with fresh content
                if (networkResponse.ok) {
                  const responseClone = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, responseClone));
                  return networkResponse;
                }
                return cachedResponse;
              })
              .catch(() => cachedResponse); // Return cached version if network fails
          }
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse.ok) {
              return networkResponse;
            }
            
            // Cache the response for future use
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
            
            return networkResponse;
          })
          .catch((err) => {
            console.log('Service Worker: Fetch failed', err);
            // Return offline page or error response
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            throw err;
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Push notifications (for future bus alerts)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New bus update available',
    icon: '/citybus-192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/citybus-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/citybus-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CityBus Go', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync location data when online
async function syncLocationData() {
  try {
    const pendingData = JSON.parse(localStorage.getItem('pendingLocationData') || '[]');
    
    if (pendingData.length > 0) {
      // In a real app, you'd send this to your server
      console.log('Service Worker: Syncing location data', pendingData);
      
      // Clear pending data after successful sync
      localStorage.removeItem('pendingLocationData');
    }
  } catch (error) {
    console.log('Service Worker: Sync failed', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_LOCATION') {
    // Cache location data for offline use
    const locationData = event.data.payload;
    caches.open(CACHE_NAME)
      .then((cache) => {
        cache.put(`/location/${locationData.routeId}`, 
          new Response(JSON.stringify(locationData), {
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
  }
});
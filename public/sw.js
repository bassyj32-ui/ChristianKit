// Service Worker for ChristianKit PWA
// Handles push notifications, background sync, and offline functionality

const CACHE_NAME = 'christiankit-v3-force-update';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-72x72.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Skip analytics and external requests
  if (event.request.url.includes('google-analytics.com') || 
      event.request.url.includes('googletagmanager.com') ||
      event.request.url.includes('doubleclick.net')) {
    return;
  }

  // For JS/CSS assets, always fetch fresh (bypass cache)
  if (event.request.url.includes('/assets/js/') || 
      event.request.url.includes('/assets/css/') ||
      event.request.url.includes('.js') ||
      event.request.url.includes('.css')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Time for your daily spiritual practice',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/',
          reminderType: data.reminderType || 'prayer'
        },
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icon-72x72.png'
          }
        ],
        requireInteraction: true,
        tag: 'christiankit-reminder',
        renotify: true
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'ChristianKit Reminder', options)
      );
      
      console.log('✅ Push notification displayed');
    } catch (error) {
      console.error('❌ Error processing push notification:', error);
      
      // Fallback notification
      const fallbackOptions = {
        body: 'Time for your daily spiritual practice',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: '/' }
      };
      
      event.waitUntil(
        self.registration.showNotification('ChristianKit Reminder', fallbackOptions)
      );
    }
  } else {
    // No data, show default notification
    const defaultOptions = {
      body: 'Time for your daily spiritual practice',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    };
    
    event.waitUntil(
      self.registration.showNotification('ChristianKit Reminder', defaultOptions)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event);
  
  if (event.tag === 'prayer-sync') {
    event.waitUntil(
      // Handle prayer data sync
      console.log('🔄 Syncing prayer data...')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

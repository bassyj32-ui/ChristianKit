// Service Worker for ChristianKit PWA
// Handles push notifications, background sync, and offline functionality

const CACHE_NAME = 'christiankit-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css'
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
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === undefined) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              return;
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            const url = event.notification.data?.url || '/';
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event);
  
  if (event.tag === 'daily-reminder-sync') {
    event.waitUntil(
      // Sync reminder data when connection returns
      syncReminderData()
    );
  }
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Don't cache if not a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  }
});

// Function to sync reminder data
async function syncReminderData() {
  try {
    console.log('🔄 Syncing reminder data...');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Send message to main app to sync data
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_REMINDER_DATA',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ Reminder data synced');
  } catch (error) {
    console.error('❌ Error syncing reminder data:', error);
  }
}

// Message event - handle communication with main app
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🚀 ChristianKit Service Worker loaded successfully');

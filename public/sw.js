// Service Worker for Push Notifications
// This handles background push notifications when the app is closed

const CACHE_NAME = 'christiankit-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'ChristianKit',
    body: 'You have a new spiritual message!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'daily-spiritual-message',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App', icon: '/icon-192x192.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: {
      url: '/',
      type: 'daily_spiritual_message'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log('Handling background sync...');
    // Add any background sync logic here
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const notificationData = event.data.data;
    
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || '/icon-192x192.png',
      badge: notificationData.badge || '/icon-72x72.png',
      tag: notificationData.tag || 'daily-spiritual-message',
      requireInteraction: notificationData.requireInteraction || true,
      actions: [
        { action: 'open', title: 'Open App', icon: '/icon-192x192.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: notificationData.data || { url: '/' }
    });
  }
});

console.log('Service Worker loaded successfully');
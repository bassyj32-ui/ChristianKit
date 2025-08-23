// Service Worker for ChristianKit Push Notifications
const CACHE_NAME = 'christiankit-v1';
const NOTIFICATION_TAG = 'christiankit-notification';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
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
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Time to connect with God',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: NOTIFICATION_TAG,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'pray', title: '🙏 Pray Now', icon: '/icon-72x72.png' },
        { action: 'snooze', title: '⏰ Later', icon: '/icon-72x72.png' }
      ],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ChristianKit', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'pray') {
    // Open app to prayer page
    event.waitUntil(
      clients.openWindow('/?tab=prayer')
    );
  } else if (event.action === 'snooze') {
    // Schedule reminder for later
    event.waitUntil(
      self.registration.showNotification('⏰ Reminder Set', {
        body: 'We\'ll remind you again in 30 minutes',
        icon: '/icon-192x192.png',
        tag: NOTIFICATION_TAG
      })
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'prayer-reminder') {
    event.waitUntil(sendPrayerReminder());
  }
});

// Send prayer reminder
async function sendPrayerReminder() {
  try {
    // This would typically sync with your backend
    console.log('📤 Sending prayer reminder...');
    
    // For now, just show a notification
    await self.registration.showNotification('🙏 Prayer Time', {
      body: 'Your daily prayer time is here',
      icon: '/icon-192x192.png',
      tag: NOTIFICATION_TAG
    });
  } catch (error) {
    console.error('❌ Failed to send prayer reminder:', error);
  }
}

// Message event for communication with main app
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 ChristianKit Service Worker loaded successfully!');

// ChristianKit Service Worker - Handles aggressive push notifications

const CACHE_NAME = 'christiankit-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Handle fetch requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Time for your daily prayer!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'pray-now',
        title: '🙏 Pray Now'
      },
      {
        action: 'snooze',
        title: '⏰ Remind Later'
      }
    ],
    data: {
      url: '/?action=pray&source=push'
    }
  };

  event.waitUntil(
    self.registration.showNotification('🔔 ChristianKit Prayer Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked', event.action);

  event.notification.close();

  if (event.action === 'pray-now') {
    // Open prayer page
    event.waitUntil(
      clients.openWindow('/?action=pray&source=notification')
    );
  } else if (event.action === 'snooze') {
    // Schedule another notification in 30 minutes
    setTimeout(() => {
      self.registration.showNotification('🙏 Snooze Over - Time to Pray!', {
        body: 'You snoozed earlier. Your spiritual growth cannot wait any longer!',
        icon: '/icon-192x192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: '/?action=pray&source=snooze' }
      });
    }, 30 * 60 * 1000); // 30 minutes
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for sending notifications when user is offline
self.addEventListener('sync', event => {
  if (event.tag === 'prayer-reminder') {
    event.waitUntil(
      // Send delayed notifications
      self.registration.showNotification('📱 You\'re Back Online!', {
        body: 'Perfect timing! God has been waiting for you to return.',
        icon: '/icon-192x192.png',
        data: { url: '/?action=pray&source=sync' }
      })
    );
  }
});

// Periodic background sync for daily reminders (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-prayer-check') {
    event.waitUntil(
      // Check if user has prayed today
      checkDailyPrayerStatus()
    );
  }
});

async function checkDailyPrayerStatus() {
  try {
    // This would normally check with your backend
    const lastPrayerTime = localStorage.getItem('lastPrayerTime');
    const now = new Date();
    const lastPrayer = lastPrayerTime ? new Date(lastPrayerTime) : null;
    
    if (!lastPrayer || (now.getTime() - lastPrayer.getTime()) > 24 * 60 * 60 * 1000) {
      // User hasn't prayed in 24+ hours - send gentle reminder
      await self.registration.showNotification('💝 We miss you!', {
        body: 'Ready to continue your prayer journey? We\'re here when you are.',
        icon: '/icon-192x192.png',
        requireInteraction: false,
        vibrate: [200],
        actions: [
          { action: 'gentle-pray', title: '🙏 Pray Now' },
          { action: 'later', title: '⏰ Later' }
        ],
        data: { url: '/?action=gentle-reminder&source=periodic' }
      });
    }
  } catch (error) {
    console.error('Failed to check prayer status:', error);
  }
}

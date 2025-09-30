// Service Worker for ChristianKit PWA Notifications
const CACHE_NAME = 'christian-kit-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  // Add other assets as needed
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from ChristianKit',
      icon: '/icon-192x192.png', // Update with your app icon
      badge: '/badge-72x72.png', // Optional
      tag: data.tag || 'general',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ChristianKit', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle click actions
  if (event.action) {
    // Custom action handling
    clients.openWindow(event.action);
  } else {
    // Default: Open the app
    clients.openWindow('/');
  }
});
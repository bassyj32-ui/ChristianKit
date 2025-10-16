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

// Fetch event for offline support (only cache static assets, not API calls)
self.addEventListener('fetch', (event) => {
  // Skip caching for API requests and auth
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('/auth/')) {
    return;
  }

  // Only cache GET requests for static assets
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).then((fetchResponse) => {
            // Don't cache if not a valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response for caching
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          });
        })
    );
  }
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
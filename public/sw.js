// Service Worker for ChristianKit Push Notifications
const CACHE_NAME = 'christiankit-v1'
const NOTIFICATION_TAG = 'christiankit-notification'

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || 'You have a new notification from ChristianKit',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: NOTIFICATION_TAG,
      data: data,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/favicon.ico'
        }
      ],
      requireInteraction: true,
      silent: false
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'ChristianKit', options)
    )
  }
})

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'open' || event.action === undefined) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event)
  
  if (event.tag === 'prayer-reminder') {
    event.waitUntil(
      // Handle prayer reminder sync
      console.log('Syncing prayer reminder...')
    )
  }
})

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('Message received in service worker:', event)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  // Handle offline functionality
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html')
      })
    )
  }
})

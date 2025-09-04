// Firebase Messaging Service Worker for ChristianKit
// This file must be in the root directory for Firebase Cloud Messaging to work

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPlP29OfGd9w0ZcAui2TOSn8PCS6CYUyy8sHKCmOH6sOLEf7GGemqyWpU1T5y2pylT8W-v78UG5uQQ2VylVpVeM",
  authDomain: "christiankit.firebaseapp.com",
  projectId: "christiankit",
  storageBucket: "christiankit.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'ChristianKit';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: payload.data || {},
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
    tag: 'christiankit-background-notification',
    renotify: true
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Background notification clicked:', event);
  
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

console.log('🚀 Firebase Messaging Service Worker loaded successfully');










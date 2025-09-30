import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// Register service worker only in production to avoid dev caching issues
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Force clear all caches on app load to prevent stale assets
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              cacheNames.forEach((cacheName) => {
                caches.delete(cacheName);
              });
            });
          }
          
          // Send message to service worker to clear caches
          if (registration.active) {
            registration.active.postMessage({ type: 'CLEAR_ALL_CACHES' });
          }
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  } else {
    // In dev, ensure any existing SWs are unregistered to prevent stale prod assets
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        r.unregister();
      });
    });
    
    // Also clear all caches in development
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Force reload after clearing to ensure clean state
    setTimeout(() => {
      if (window.location.search.includes('sw-cleared')) return;
      window.location.href = window.location.href + '?sw-cleared=1';
    }, 500);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

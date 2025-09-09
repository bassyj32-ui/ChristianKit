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
          console.log('✅ Service Worker registered (prod):', registration);
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
        console.log('🧹 Dev mode: unregistered service worker');
      });
      console.log('🧹 Dev mode: unregistered all existing Service Workers');
    });
    
    // Also clear all caches in development
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
          console.log('🧹 Dev mode: cleared cache:', cacheName);
        });
      });
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

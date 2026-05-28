import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline capabilities (Behesht Zahra Map & Grave Caching)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope: ', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] ServiceWorker registration failed: ', error);
        });
    });
  } else {
    // In development mode, actively unregister any existing service worker to prevent
    // stale cache loops or hot reload conflicts that cause infinite refreshes!
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[PWA-Dev] Cleaned up & unregistered stale Dev ServiceWorker');
          }
        });
      }
    }).catch((err) => {
      console.warn('[PWA-Dev] Error unregistering service worker:', err);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

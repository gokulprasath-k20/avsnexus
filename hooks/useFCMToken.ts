'use client';

import { useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Hook that:
 * 1. Registers the firebase-messaging-sw.js service worker
 * 2. Requests notification permission
 * 3. Gets the FCM token
 * 4. Saves it to the backend via PATCH /api/users/fcm-token
 *
 * Call this inside a client component that renders after login.
 */
export function useFCMToken() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (!VAPID_KEY) {
      console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set');
      return;
    }

    const setup = async () => {
      try {
        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[FCM] Notification permission denied');
          return;
        }

        // 2. Register Service Worker
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;

        // 3. Import Firebase dynamically (avoids SSR issues)
        const { initializeApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken } = await import('firebase/messaging');

        const app =
          getApps().length > 0
            ? getApps()[0]
            : initializeApp(firebaseConfig);

        const messaging = getMessaging(app);

        // 4. Get FCM token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!token) {
          console.warn('[FCM] No token received');
          return;
        }

        // 5. Check if already saved to avoid redundant API calls
        const stored = localStorage.getItem('fcm_token');
        if (stored === token) return;

        // 6. Save to backend
        const res = await fetch(getApiUrl('/api/users/fcm-token'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          localStorage.setItem('fcm_token', token);
          console.log('[FCM] Token registered successfully');
        }
      } catch (err) {
        // Non-fatal — app still works without push
        console.error('[FCM] Setup failed:', err);
      }
    };

    // Slight delay so login/auth completes first
    const timer = setTimeout(setup, 2000);
    return () => clearTimeout(timer);
  }, []);
}

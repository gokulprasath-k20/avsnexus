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
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }
    if (!VAPID_KEY) {
      alert('[FCM Debug] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing! Vercel environment variables need to be updated.');
      return;
    }

    const setup = async () => {
      try {
        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('[FCM Debug] Notification permission was DENIED by the browser. Please reset site settings and allow.');
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
          alert('[FCM Debug] Failed to generate FCM token from Firebase.');
          return;
        }

        // 5. Always save to backend (idempotent $addToSet ensures no duplicates)
        const res = await fetch(getApiUrl('/api/users/fcm-token'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          localStorage.setItem('fcm_token', token);
          console.log('[FCM] Token registered successfully to DB');
        } else {
          const errData = await res.json();
          alert('[FCM Debug] Failed to save token to database: ' + JSON.stringify(errData));
        }

        // 7. Handle foreground messages (when app is open)
        const { onMessage } = await import('firebase/messaging');
        onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground message received:', payload);
          const title = payload.notification?.title || 'AVS Nexus';
          const options = {
            body: payload.notification?.body || 'You have a new notification.',
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            data: payload.data,
          };
          // Show OS popup even when app is open
          swReg.showNotification(title, options);
        });

      } catch (err: any) {
        // Non-fatal — app still works without push
        console.error('[FCM] Setup failed:', err);
        alert('[FCM Debug] Setup Error: ' + err.message);
      }
    };

    // Slight delay so login/auth completes first
    const timer = setTimeout(setup, 2000);
    return () => clearTimeout(timer);
  }, []);
}

'use client';

import { useEffect, useRef } from 'react';
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
 * useFCMToken — called from AppShell (authenticated shell)
 *
 * Runs once per page load when the user is logged in:
 * 1. Registers firebase-messaging-sw.js
 * 2. Gets FCM token (only if permission already granted)
 * 3. Saves token to backend via JWT cookie (credentials: include)
 * 4. Attaches foreground onMessage handler — shows OS popup via SW
 *
 * De-duplicated: token is only POSTed when it has changed since last save.
 * The onMessage listener is registered once via a module-level flag so
 * AppShell remounts (navigation) don't stack duplicate listeners.
 */

let foregroundListenerAttached = false; // module-level — survives re-renders

export function useFCMToken() {
  const tokenSyncDone = useRef(false);

  useEffect(() => {
    if (tokenSyncDone.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return; // banner handles prompt
    if (!VAPID_KEY) {
      console.error('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing');
      return;
    }

    const run = async () => {
      try {
        // 1. Register / reuse SW
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;

        // 2. Init Firebase (dynamic import — no SSR)
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // 3. Get FCM token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!token) {
          console.warn('[FCM] No token returned — check VAPID key & SW');
          return;
        }

        // 4. Only write to backend when token has changed
        const stored = localStorage.getItem('fcm_token');
        if (stored !== token) {
          const res = await fetch(getApiUrl('/api/users/fcm-token'), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // sends httpOnly JWT cookie — NOT localStorage
            body: JSON.stringify({ token }),
          });

          if (res.ok) {
            localStorage.setItem('fcm_token', token);
            console.log('[FCM] Token registered to DB');
          } else {
            const errData = await res.json().catch(() => ({}));
            console.error('[FCM] Token save failed:', errData);
          }
        } else {
          console.log('[FCM] Token unchanged — skipping DB write');
        }

        tokenSyncDone.current = true;

        // 5. Foreground message handler — only attach once per browser session
        if (!foregroundListenerAttached) {
          foregroundListenerAttached = true;
          onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground message:', payload);
            const title = payload.notification?.title || 'AVS Nexus';
            const body  = payload.notification?.body  || 'New notification.';
            // Use the SW so notification appears as a native OS popup
            swReg.showNotification(title, {
              body,
              icon: '/icon-512.png',
              badge: '/icon-512.png',
              data: {
                url: payload.data?.url || '/student-dashboard',
                ...payload.data,
              },
            });
          });
        }
      } catch (err: any) {
        console.error('[FCM] Setup error:', err?.message ?? err);
      }
    };

    // Slight delay to let auth cookie settle
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, []);
}

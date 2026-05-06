'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
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

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const fcmSetupDone = useRef(false);

  // ─── On user login, decide whether to prompt or auto-register ───
  useEffect(() => {
    if (!user) return;
    if (fcmSetupDone.current) return;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Already allowed — silently register token
      fcmSetupDone.current = true;
      setupFCM(false);
    } else if (Notification.permission === 'default') {
      // Show prompt banner after 2 s if not dismissed
      const timer = setTimeout(() => {
        if (!localStorage.getItem('notificationPromptDismissed')) {
          setShowBanner(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
    // 'denied' → do nothing
  }, [user]);

  // ─── Core FCM setup ───────────────────────────────────────────────────────
  const setupFCM = async (requestPermission: boolean) => {
    try {
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator)) {
        console.warn('[FCM] Service Workers not supported');
        return;
      }
      if (!VAPID_KEY) {
        console.error('[FCM] VAPID key missing — check Vercel env vars');
        return;
      }

      // 1. Request permission if needed
      if (requestPermission) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          localStorage.setItem('notificationPromptDismissed', 'true');
          toast.error('Notifications blocked. Enable them in browser settings.');
          return;
        }
      }

      // 2. Register / reuse service worker
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      // 3. Init Firebase (dynamic import avoids SSR)
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // 4. Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        console.warn('[FCM] No token returned — check VAPID key and permissions');
        return;
      }

      // 5. Skip backend save if same token already stored
      const stored = localStorage.getItem('fcm_token');
      if (stored !== token) {
        // Use credentials:include (JWT cookie) — NOT localStorage JWT
        const res = await fetch(getApiUrl('/api/users/fcm-token'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          localStorage.setItem('fcm_token', token);
          console.log('[FCM] Token registered to DB');
          if (requestPermission) toast.success('🔔 Notifications enabled!');
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('[FCM] Failed to save token:', err);
        }
      } else {
        console.log('[FCM] Token unchanged — skipping DB write');
      }

      // 6. Listen for foreground messages → show OS-level popup via SW
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'AVS Nexus';
        const body  = payload.notification?.body  || 'You have a new notification.';
        const url   = payload.data?.url || '/student-dashboard';

        // Show via the registered service worker so it looks native
        swReg.showNotification(title, {
          body,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
          data: { url },
        });
      });

    } catch (err: any) {
      console.error('[FCM] Setup error:', err?.message ?? err);
    }
  };

  // ─── Banner actions ───────────────────────────────────────────────────────
  const handleAllow = async () => {
    setShowBanner(false);
    fcmSetupDone.current = true;
    await setupFCM(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-[calc(1.5rem+var(--safe-bottom))] left-4 right-4 md:left-auto md:right-4 z-[110] animate-fade-up">
      <div className="bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-2xl p-4 flex flex-col gap-3 max-w-[350px]">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-fade)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">Enable Notifications?</p>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">
                Get instant alerts for new tasks, deadlines, and evaluation results.
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-xs font-bold text-[var(--muted)] hover:bg-[var(--muted-fade)] rounded-xl transition-all"
          >
            Later
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 px-4 py-2 text-xs font-bold bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

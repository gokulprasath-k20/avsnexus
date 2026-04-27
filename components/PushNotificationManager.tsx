'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

export default function PushNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check if notifications are supported and permitted
    const setupNotifications = async () => {
      if (!('Notification' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await requestForToken();
        if (token) {
          // Send token to backend
          try {
            await fetch(getApiUrl('/api/users/fcm-token'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
          } catch (error) {
            console.error('Error saving FCM token', error);
          }
        }
      }
    };

    // Only ask for permission after a slight delay to not overwhelm the user
    const timer = setTimeout(() => {
      setupNotifications();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    // Listen for foreground messages
    const listen = async () => {
      try {
        const payload: any = await onMessageListener();
        if (payload?.notification) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[13px]">{payload.notification.title}</span>
                <span className="text-xs text-[var(--muted)]">{payload.notification.body}</span>
              </div>
            ),
            { duration: 5000 }
          );
        }
        listen(); // Recursively call to keep listening
      } catch (err) {
        console.log('Error listening to messages', err);
      }
    };

    listen();
  }, []);

  return null; // This component does not render any UI
}

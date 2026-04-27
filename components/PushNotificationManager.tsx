'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

export default function PushNotificationManager() {
  const { user } = useAuth();

  const [showBell, setShowBell] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowBell(true);
      }
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setShowBell(false);
      const token = await requestForToken();
      if (token) {
        try {
          const jwtToken = localStorage.getItem('token');
          if (!jwtToken) return;
          
          await fetch(getApiUrl('/api/users/fcm-token'), {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ token }),
          });
          toast.success('Notifications enabled!');
        } catch (error) {
          console.error('Error saving FCM token', error);
        }
      }
    } else {
      setShowBell(false);
      toast.error('Notifications blocked by browser.');
    }
  };

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

  if (!showBell) return null;

  return (
    <button
      onClick={handleEnableNotifications}
      className="fixed bottom-[calc(1rem+var(--safe-bottom))] left-4 z-[100] bg-[var(--primary)] text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all animate-bounce"
      title="Enable Push Notifications"
    >
      <Bell size={20} />
    </button>
  );
}

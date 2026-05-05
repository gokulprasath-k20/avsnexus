'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Show banner after 3 seconds on first visit
        const timer = setTimeout(() => {
          if (!localStorage.getItem('notificationPromptDismissed')) {
            setShowBanner(true);
          }
        }, 3000);
        return () => clearTimeout(timer);
      } else if (Notification.permission === 'granted') {
        // Ensure token is synced with DB
        syncToken();
      }
    }
  }, [user]);

  const syncToken = async () => {
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
      } catch (err) {
        console.error('Failed to sync FCM token:', err);
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    setShowBanner(false);
    
    if (permission === 'granted') {
      await syncToken();
      toast.success('Notifications enabled!');
    } else {
      localStorage.setItem('notificationPromptDismissed', 'true');
      toast.error('Notifications blocked by browser.');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setShowBanner(false);
  };

  useEffect(() => {
    // Listen for foreground messages
    const listen = async () => {
      try {
        const payload: any = await onMessageListener();
        if (payload?.notification) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1 pr-6 relative">
                <span className="font-bold text-[13px]">{payload.notification.title}</span>
                <span className="text-xs text-[var(--muted)]">{payload.notification.body}</span>
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (payload.data?.url) window.location.href = payload.data.url;
                  }}
                  className="mt-2 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider text-left"
                >
                  View Details →
                </button>
              </div>
            ),
            { duration: 6000 }
          );
        }
        listen(); // Recursively call to keep listening
      } catch (err) {
        console.log('Error listening to messages', err);
      }
    };

    listen();
  }, []);

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-[calc(1.5rem+var(--safe-bottom))] left-4 right-4 md:left-auto md:right-4 z-[110] animate-fade-up"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-2xl p-4 flex flex-col gap-3 max-w-[350px]">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-fade)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">Enable Notifications?</p>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">
                Stay updated with new tasks, deadline reminders, and evaluation results.
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
            onClick={handleEnableNotifications}
            className="flex-1 px-4 py-2 text-xs font-bold bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

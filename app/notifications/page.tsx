'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import {
  Bell, CheckCheck, Trash2, Clock, Megaphone,
  AlertTriangle, CheckCircle2, XCircle, Zap, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  image?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  announcement: {
    icon: <Megaphone size={14} strokeWidth={2.5} />,
    color: 'var(--primary)',
    bg: 'var(--primary-fade)',
  },
  new_task: {
    icon: <Zap size={14} strokeWidth={2.5} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  deadline_reminder: {
    icon: <AlertTriangle size={14} strokeWidth={2.5} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  task_failed: {
    icon: <XCircle size={14} strokeWidth={2.5} />,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
  },
  submission_reviewed: {
    icon: <CheckCircle2 size={14} strokeWidth={2.5} />,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  system: {
    icon: <Info size={14} strokeWidth={2.5} />,
    color: 'var(--muted)',
    bg: 'var(--surface)',
  },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/notifications'), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch(getApiUrl('/api/notifications'), {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markOne = async (id: string) => {
    try {
      await fetch(getApiUrl('/api/notifications'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* ignore */ }
  };

  const displayed = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell title="Notifications" subtitle="Your activity feed">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
                background: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? 'white' : 'var(--muted)',
                transition: 'all 0.15s',
              }}
            >
              {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '10px',
              fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: '0.04em', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={12} strokeWidth={2.5} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: '72px', borderRadius: '14px',
              background: 'var(--surface)', animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--surface)', borderRadius: '20px',
          border: '1px solid var(--border)',
        }}>
          <Bell size={32} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--muted)' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayed.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            return (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) markOne(notif._id);
                  if (notif.link) window.location.href = notif.link;
                }}
                style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  padding: '14px', borderRadius: '14px',
                  background: notif.isRead ? 'var(--surface)' : 'var(--primary-fade)',
                  border: `1px solid ${notif.isRead ? 'var(--border)' : 'var(--primary)'}`,
                  cursor: notif.link ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {/* Unread dot */}
                {!notif.isRead && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--primary)',
                  }} />
                )}

                {/* Type icon */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '13px', fontWeight: '800',
                      color: 'var(--foreground)',
                    }}>
                      {notif.title}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '12px', color: 'var(--muted)', fontWeight: '500',
                    margin: '0 0 6px', lineHeight: 1.5,
                  }}>
                    {notif.message}
                  </p>

                  {/* Image */}
                  {notif.image && (
                    <div style={{ marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', maxHeight: '160px' }}>
                      <img
                        src={notif.image}
                        alt="Notification image"
                        style={{ width: '100%', objectFit: 'cover', maxHeight: '160px' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={9} strokeWidth={2} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '700' }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

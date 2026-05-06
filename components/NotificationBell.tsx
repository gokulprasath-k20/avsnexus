'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ArrowRight, Megaphone, Zap, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  image?: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  announcement: <Megaphone size={12} strokeWidth={2.5} />,
  new_task: <Zap size={12} strokeWidth={2.5} />,
  deadline_reminder: <AlertTriangle size={12} strokeWidth={2.5} />,
  task_failed: <XCircle size={12} strokeWidth={2.5} />,
  submission_reviewed: <CheckCircle2 size={12} strokeWidth={2.5} />,
  system: <Info size={12} strokeWidth={2.5} />,
};

const TYPE_COLOR: Record<string, string> = {
  announcement: 'var(--primary)',
  new_task: '#f59e0b',
  deadline_reminder: '#f59e0b',
  task_failed: '#ef4444',
  submission_reviewed: '#22c55e',
  system: 'var(--muted)',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(getApiUrl('/api/notifications'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch(getApiUrl('/api/notifications'), {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOne = async (id: string) => {
    await fetch(getApiUrl('/api/notifications'), {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ notificationId: id }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative', width: '36px', height: '36px',
          borderRadius: '8px', border: '1px solid var(--border)',
          background: open ? 'var(--surface-hover)' : 'var(--surface)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--foreground)',
          transition: 'background 0.15s',
        }}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={unreadCount > 0 ? 2.5 : 2} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            minWidth: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--danger)', border: '2px solid var(--background)',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute', top: '44px', right: 0,
            width: '340px', maxWidth: 'calc(100vw - 20px)',
            background: 'var(--background)', border: '1px solid var(--border)',
            borderRadius: '14px', boxShadow: 'var(--shadow-md)',
            zIndex: 200, overflow: 'hidden',
          }}
          className="animate-fade-up"
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--primary)', color: 'white',
                  borderRadius: '10px', padding: '0px 6px',
                  fontSize: '10px', fontWeight: '900',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/notifications/test', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) fetchNotifications();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{
                  fontSize: '10px', fontWeight: '800', color: 'var(--muted)',
                  background: 'none', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer',
                }}
              >
                Test Push
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: '10px', fontWeight: '800', color: 'var(--primary)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px',
                  }}
                >
                  <Check size={10} strokeWidth={3} /> All read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: '10px', fontWeight: '800', color: 'var(--muted)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px',
                }}
              >
                See all <ArrowRight size={10} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px', textAlign: 'center',
                color: 'var(--muted)', fontSize: '12px', fontWeight: '600',
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const icon = TYPE_ICON[n.type] || TYPE_ICON.system;
                const color = TYPE_COLOR[n.type] || 'var(--muted)';

                const inner = (
                  <div
                    key={n._id}
                    onClick={() => { if (!n.isRead) markOne(n._id); if (!n.link) setOpen(false); }}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                      background: n.isRead ? 'transparent' : 'var(--primary-fade)',
                      cursor: 'pointer', transition: 'background 0.12s',
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--primary-fade)')}
                  >
                    {/* Type icon */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: `${color}18`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', lineHeight: 1.3 }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: 'var(--primary)', flexShrink: 0, marginTop: '3px',
                          }} />
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.message}
                      </p>
                      {n.image && (
                        <img
                          src={n.image}
                          alt=""
                          style={{ marginTop: '6px', width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px', display: 'block' }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link key={n._id} href={n.link} onClick={() => setOpen(false)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n._id}>{inner}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              padding: '10px', fontSize: '11px', fontWeight: '800',
              color: 'var(--primary)', textDecoration: 'none',
              borderTop: '1px solid var(--border)',
              transition: 'background 0.12s',
            }}
          >
            View all notifications <ArrowRight size={11} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}

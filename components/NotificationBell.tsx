'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
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
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground)',
          transition: 'background 0.15s',
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--danger)',
              border: '2px solid var(--background)',
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: '360px',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            overflow: 'hidden',
          }}
          className="animate-fade-up"
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: '12px',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: n.isRead ? 'transparent' : 'rgba(37,99,235,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.isRead
                        ? 'transparent'
                        : 'rgba(37,99,235,0.04)')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      {!n.isRead && (
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            flexShrink: 0,
                            marginTop: '5px',
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'var(--foreground)',
                            marginBottom: '2px',
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4' }}
                        >
                          {n.message}
                        </div>
                        <div
                          style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}
                        >
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link key={n._id} href={n.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n._id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: '60px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        background: 'var(--background)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--foreground)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.role === 'student' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: 'var(--surface)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>
              {user?.totalPoints?.toLocaleString() || 0}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>pts</span>
          </div>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}

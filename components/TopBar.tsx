'use client';

import React from 'react';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="px-1.5 md:px-3"
      style={{
        height: 'calc(34px + var(--safe-top))',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--background)',
        paddingTop: 'var(--safe-top)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center justify-center w-6 h-6 bg-[var(--foreground)] rounded-md">
           <span className="text-[var(--background)] text-[10px] font-bold">AV</span>
        </div>
        
        <div className="flex flex-col">
          <h1
            className="truncate max-w-[120px] sm:max-w-none"
            style={{
              fontSize: '10px',
              fontWeight: '900',
              color: 'var(--foreground)',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block" style={{ fontSize: '8px', color: 'var(--muted)', marginTop: '0px', fontWeight: '700', textTransform: 'uppercase' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {user?.role === 'student' && (
          <div
            className="flex items-center gap-1 px-2 py-1 bg-[var(--surface)] rounded-full border border-[var(--border)]"
          >
            <span className="text-xs">⚡</span>
            <span className="text-[11px] font-bold text-[var(--foreground)]">
              {user?.totalPoints || 0}
            </span>
          </div>
        )}
        
        <button
          onClick={toggleTheme}
          className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-hover)]"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={11} /> : <Sun size={11} />}
        </button>

        <NotificationBell />

        {/* Mobile Logout */}
        <button
          onClick={logout}
          className="md:hidden w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--danger)] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--danger)]/10"
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}

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
        height: 'calc(48px + var(--safe-top))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent',
        paddingTop: 'var(--safe-top)',
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center justify-center w-6 h-6 bg-[var(--primary)] rounded-md">
           <span className="text-[var(--background)] text-[10px] font-bold">AV</span>
        </div>
        
        <div className="flex flex-col">
          <h1
            className="truncate max-w-[120px] sm:max-w-none"
            style={{
              fontSize: '12px',
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
            <p className="hidden sm:block" style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', fontWeight: '700', textTransform: 'uppercase' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Search your next task..." 
            className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted/60"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted/60 font-black">⌘K</div>
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

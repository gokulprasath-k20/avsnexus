'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Bell,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Settings,
  Users,
  BarChart3,
  Layers,
  Terminal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from './NotificationBell';

const studentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/modules', label: 'Modules', icon: BookOpen },
  { href: '/playground', label: 'Playground', icon: Terminal },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { href: '/admin/modules', label: 'My Module', icon: Layers },
  { href: '/admin/submissions', label: 'Submissions', icon: BookOpen },
];

const superAdminNav = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/students', label: 'Students', icon: Users },
  { href: '/superadmin/admins', label: 'Admins', icon: BookOpen },
  { href: '/playground', label: 'Playground', icon: Terminal },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!user) return null;

  const navItems =
    user.role === 'superAdmin'
      ? superAdminNav
      : user.role === 'moduleAdmin'
      ? adminNav
      : studentNav;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="hidden md:flex"
      style={{
        width: '160px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        paddingLeft: 'var(--safe-left)',
        paddingTop: 'var(--safe-top)',
      }}
    >
      {/* Logo - Compact */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href={user.role === 'student' ? '/dashboard' : user.role === 'superAdmin' ? '/superadmin' : '/admin/modules'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                background: 'var(--foreground)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'var(--background)',
                  fontSize: '9px',
                  fontWeight: '900',
                  letterSpacing: '-0.02em',
                }}
              >
                AV
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  color: 'var(--foreground)',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}
              >
                Nexus
              </div>
              <div style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: '900', textTransform: 'uppercase' }}>
                {user.role === 'superAdmin' ? 'Super' : user.role === 'moduleAdmin' ? 'Admin' : 'Student'}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation - High Density */}
      <nav style={{ flex: 1, padding: '4px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '1px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginBottom: '1px',
                    background: isActive ? 'var(--foreground)' : 'transparent',
                    color: isActive ? 'var(--background)' : 'var(--muted-fg)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                      e.currentTarget.style.color = 'var(--foreground)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--muted-fg)';
                    }
                  }}
                >
                  <Icon size={12} strokeWidth={isActive ? 3 : 2} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom - Ultra Compact */}
      <div
        style={{
          padding: '4px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-fg)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '800',
            width: '100%',
            transition: 'all 0.1s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--muted-fg)';
          }}
        >
          {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-fg)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '800',
            width: '100%',
            transition: 'all 0.1s ease',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--muted-fg)';
          }}
        >
          <LogOut size={12} />
          Logout
        </button>

        {/* User avatar - Shrunk */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            marginTop: '2px',
            borderRadius: '4px',
            background: 'var(--surface-hover)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: 'var(--foreground)',
              color: 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '900',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '900',
                color: 'var(--foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1',
                textTransform: 'uppercase',
              }}
            >
              {user.name.split(' ')[0]}
            </div>
            <div
              style={{
                fontSize: '8px',
                color: 'var(--muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: '700',
              }}
            >
              {user.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

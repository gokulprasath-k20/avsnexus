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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from './NotificationBell';

const studentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/modules', label: 'Modules', icon: BookOpen },
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
      style={{
        width: '240px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href={user.role === 'student' ? '/dashboard' : user.role === 'superAdmin' ? '/superadmin' : '/admin/modules'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--foreground)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'var(--background)',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                }}
              >
                AV
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--foreground)',
                  letterSpacing: '-0.01em',
                }}
              >
                AVS Nexus
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {user.role === 'superAdmin'
                  ? 'Super Admin'
                  : user.role === 'moduleAdmin'
                  ? 'Module Admin'
                  : 'Student'}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '4px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'var(--muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0 12px',
              marginBottom: '8px',
            }}
          >
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '2px',
                    background: isActive ? 'var(--foreground)' : 'transparent',
                    color: isActive ? 'var(--background)' : 'var(--muted-fg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '500' : '400',
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
                  <Icon size={16} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-fg)',
            cursor: 'pointer',
            fontSize: '13.5px',
            width: '100%',
            transition: 'all 0.15s ease',
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
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-fg)',
            cursor: 'pointer',
            fontSize: '13.5px',
            width: '100%',
            transition: 'all 0.15s ease',
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
          <LogOut size={16} />
          Sign out
        </button>

        {/* User avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginTop: '4px',
            borderRadius: '6px',
            background: 'var(--surface-hover)',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--foreground)',
              color: 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '600',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: '500',
                color: 'var(--foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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

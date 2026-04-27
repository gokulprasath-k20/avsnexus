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
        width: '190px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
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
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href={user.role === 'student' ? '/dashboard' : user.role === 'superAdmin' ? '/superadmin' : '/admin/modules'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                background: 'var(--foreground)',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'var(--background)',
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                }}
              >
                AV
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--foreground)',
                  letterSpacing: '-0.01em',
                }}
              >
                AVS Nexus
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '500' }}>
                {user.role === 'superAdmin' ? 'Super' : user.role === 'moduleAdmin' ? 'Admin' : 'Student'}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '6px 6px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2px' }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: '700',
              color: 'var(--muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0 8px',
              marginBottom: '4px',
            }}
          >
            Menu
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
                    gap: '6px',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    marginBottom: '1px',
                    background: isActive ? 'var(--foreground)' : 'transparent',
                    color: isActive ? 'var(--background)' : 'var(--muted-fg)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    fontSize: '12px',
                    fontWeight: isActive ? '600' : '500',
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
                  <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
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
          padding: '6px',
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
            padding: '5px 8px',
            borderRadius: '5px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-fg)',
            cursor: 'pointer',
            fontSize: '12px',
            width: '100%',
            transition: 'all 0.1s ease',
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

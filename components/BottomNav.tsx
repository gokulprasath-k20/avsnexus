'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const studentNav = [
  { href: '/student-dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/modules', label: 'Modules', icon: BookOpen },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { href: '/admin-dashboard/modules', label: 'Modules', icon: Layers },
  { href: '/admin-dashboard/submissions', label: 'Grading', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

const superAdminNav = [
  { href: '/superadmin-dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/superadmin-dashboard/students', label: 'Students', icon: Users },
  { href: '/superadmin-dashboard/admins', label: 'Admins', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems =
    user.role === 'superadmin'
      ? superAdminNav
      : user.role === 'admin' || user.role === 'moduleAdmin'
      ? adminNav
      : studentNav;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] px-1 shadow-lg"
      style={{
        height: 'calc(52px + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/student-dashboard' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-colors"
            style={{
              color: isActive ? 'var(--primary)' : 'var(--muted)',
            }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span
              style={{
                fontSize: '9px',
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

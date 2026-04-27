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
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/modules', label: 'Modules', icon: BookOpen },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { href: '/admin/modules', label: 'Modules', icon: Layers },
  { href: '/admin/submissions', label: 'Grading', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

const superAdminNav = [
  { href: '/superadmin', label: 'Home', icon: LayoutDashboard },
  { href: '/superadmin/students', label: 'Students', icon: Users },
  { href: '/superadmin/admins', label: 'Admins', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems =
    user.role === 'superAdmin'
      ? superAdminNav
      : user.role === 'moduleAdmin'
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
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        
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

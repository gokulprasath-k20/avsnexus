'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Mail, Shield, Star, Sun, Moon } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const roleLabels: Record<string, string> = {
    student: 'Student',
    moduleAdmin: 'Module Admin',
    superAdmin: 'Super Admin',
  };

  return (
    <AppShell title="Profile" subtitle="Your account information">
      <div className="max-w-2xl mx-auto md:mx-0">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 transition-all hover:shadow-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-3xl font-bold shrink-0 shadow-lg">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight mb-1">
              {user.name}
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
                {roleLabels[user.role] || user.role}
              </span>
              {user.role === 'student' && (
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--success)] bg-[var(--success)]/10 px-3 py-1 rounded-full border border-[var(--success)]/20">
                  {user.category === 'elite' ? 'Elite Student' : 'Student'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)] shadow-sm">
          {[
            { icon: <User size={18} />, label: 'Full Name', value: user.name },
            { icon: <Mail size={18} />, label: 'Email Address', value: user.email },
            { icon: <Shield size={18} />, label: 'Account Level', value: roleLabels[user.role] || user.role },
            { icon: <Star size={18} />, label: 'Achievement Points', value: `${user.totalPoints?.toLocaleString() || 0} points` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-[var(--surface-hover)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] shrink-0 shadow-sm">
                {icon}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-0.5">
                  {label}
                </div>
                <div className="text-sm sm:text-base text-[var(--foreground)] font-semibold tracking-tight">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Theme Preferences */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>
            App Appearance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div 
              onClick={() => theme !== 'light' && toggleTheme()}
              style={{ 
                padding: '12px', 
                background: theme === 'light' ? 'var(--foreground)' : 'var(--surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: theme === 'light' ? 'var(--background)' : 'var(--surface-hover)', color: theme === 'light' ? 'var(--foreground)' : 'var(--muted)' }}>
                  <Sun size={14} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme === 'light' ? 'var(--background)' : 'var(--foreground)' }}>Light</span>
              </div>
              <p style={{ fontSize: '10px', color: theme === 'light' ? 'var(--background)' : 'var(--muted)', opacity: 0.8 }}>Default experience</p>
            </div>

            <div 
              onClick={() => theme !== 'dark' && toggleTheme()}
              style={{ 
                padding: '12px', 
                background: theme === 'dark' ? 'var(--foreground)' : 'var(--surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: theme === 'dark' ? 'var(--background)' : 'var(--surface-hover)', color: theme === 'dark' ? 'var(--foreground)' : 'var(--muted)' }}>
                  <Moon size={14} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme === 'dark' ? 'var(--background)' : 'var(--foreground)' }}>Dark</span>
              </div>
              <p style={{ fontSize: '10px', color: theme === 'dark' ? 'var(--background)' : 'var(--muted)', opacity: 0.8 }}>Better for low light</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

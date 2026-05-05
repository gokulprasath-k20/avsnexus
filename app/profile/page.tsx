'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Mail, Shield, Star, Sun, Moon, Bell } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const roleLabels: Record<string, string> = {
    student: 'Student',
    moduleAdmin: 'Module Admin',
    superadmin: 'Super Admin',
  };

  return (
    <AppShell title="Profile" subtitle="Your account information">
      <div className="max-w-2xl mx-auto md:mx-0">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 transition-all hover:shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-xl font-black shrink-0 shadow-md">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight mb-0.5">
              {user.name}
            </h2>
            <p className="text-xs text-[var(--muted)] mb-3 font-medium">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md border border-[var(--primary)]/20">
                {roleLabels[user.role] || user.role}
              </span>
              {user.role === 'student' && (
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-md border border-[var(--success)]/20">
                  {user.category === 'elite' ? 'Elite Student' : 'Student'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
          {[
            { icon: <User size={14} />, label: 'Full Name', value: user.name },
            { icon: <Mail size={14} />, label: 'Email Address', value: user.email },
            { icon: <Shield size={14} />, label: 'Account Level', value: roleLabels[user.role] || user.role },
            { icon: <Star size={14} />, label: 'Achievements', value: `${user.totalPoints?.toLocaleString() || 0} pts` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="p-3 sm:p-4 flex items-center gap-3 hover:bg-[var(--surface-hover)] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] shrink-0 shadow-sm">
                {icon}
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-[var(--muted)] uppercase font-black tracking-widest mb-0.5">
                  {label}
                </div>
                <div className="text-xs text-[var(--foreground)] font-bold tracking-tight">
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

        {/* Notification Preferences */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>
            Notifications
          </h3>
          <div 
            style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-fade)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={18} style={{ margin: 'auto' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)' }}>Push Notifications</p>
                <p style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                    ? 'Successfully enabled on this device' 
                    : 'Get real-time updates and reminders'}
                </p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                if (!('Notification' in window)) return;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  window.location.reload(); // Refresh to sync token
                } else {
                  alert("Notifications are disabled in your browser settings. Please enable them to receive updates.");
                }
              }}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '10px', 
                fontSize: '11px', 
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? 'var(--muted-fade)' : 'var(--primary)',
                color: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? 'var(--muted)' : 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

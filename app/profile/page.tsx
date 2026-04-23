'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Star } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const roleLabels: Record<string, string> = {
    student: 'Student',
    moduleAdmin: 'Module Admin',
    superAdmin: 'Super Admin',
  };

  return (
    <AppShell title="Profile" subtitle="Your account information">
      <div style={{ maxWidth: '600px' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--foreground)',
              color: 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '700',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {user.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>{user.email}</p>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--primary)',
                background: 'rgba(37,99,235,0.1)',
                padding: '3px 10px',
                borderRadius: '4px',
              }}
            >
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <User size={16} />, label: 'Full Name', value: user.name },
            { icon: <Mail size={16} />, label: 'Email Address', value: user.email },
            { icon: <Shield size={16} />, label: 'Role', value: roleLabels[user.role] || user.role },
            { icon: <Star size={16} />, label: 'Total Points', value: `${user.totalPoints?.toLocaleString() || 0} points` },
          ].map(({ icon, label, value }, idx) => (
            <div
              key={label}
              style={{
                padding: '16px 22px',
                borderBottom: idx < 3 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ color: 'var(--muted)', flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '500' }}>
                  {label}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: '500' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

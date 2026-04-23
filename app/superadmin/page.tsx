'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Users, UserCog } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalAdmins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error && d.users) {
          const students = d.users.filter((u: any) => u.role === 'student').length;
          const admins = d.users.filter((u: any) => u.role === 'moduleAdmin').length;
          setStats({ totalStudents: students, totalAdmins: admins });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Dashboard" subtitle="System Overview">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Students Card */}
          <Link href="/superadmin/students" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>Students</h2>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                  {stats.totalStudents}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Manage student records and performance</p>
              </div>
            </div>
          </Link>

          {/* Admins Card */}
          <Link href="/superadmin/admins" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>Admins</h2>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                  {stats.totalAdmins}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>View module admins and their tasks</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </AppShell>
  );
}

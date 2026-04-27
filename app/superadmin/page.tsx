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
    <AppShell title="SuperAdmin" subtitle="System Overview">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '20px', height: '20px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Students Card */}
          <Link href="/superadmin/students" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Students</h2>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--foreground)', lineHeight: 1 }}>
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </Link>

          {/* Admins Card */}
          <Link href="/superadmin/admins" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Admins</h2>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--foreground)', lineHeight: 1 }}>
                  {stats.totalAdmins}
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </AppShell>
  );
}

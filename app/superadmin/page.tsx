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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          {/* Students Card - Ultra Compact */}
          <Link href="/superadmin/students" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--foreground)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: '8px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0px' }}>Students</h2>
                <p style={{ fontSize: '16px', fontWeight: '900', color: 'var(--foreground)', lineHeight: 1 }}>
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </Link>

          {/* Admins Card - Ultra Compact */}
          <Link href="/superadmin/admins" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--foreground)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: '8px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0px' }}>Admins</h2>
                <p style={{ fontSize: '16px', fontWeight: '900', color: 'var(--foreground)', lineHeight: 1 }}>
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

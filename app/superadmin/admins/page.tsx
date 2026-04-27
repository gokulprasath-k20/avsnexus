'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  assignedModuleType?: string;
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users?role=moduleAdmin')
      .then((r) => r.json())
      .then((d) => setAdmins(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  const getModuleLabel = (type?: string) => {
    switch (type) {
      case 'coding': return 'Code Challenge';
      case 'mcq': return 'MCQ';
      case 'file_upload': return 'Presentation';
      default: return type || 'Unassigned';
    }
  };

  return (
    <AppShell title="Admins" subtitle="Manage administrators">
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 150px 30px', gap: '12px', alignItems: 'center', background: 'var(--surface-hover)' }}>
          {['Admin', 'Module', ''].map((h) => (
            <span key={h} style={{ fontSize: '9px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>No admins found.</div>
        ) : (
          admins.map((admin) => {
            const initials = admin.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <Link key={admin._id} href={`/superadmin/admins/${admin._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 150px 30px',
                    gap: '12px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{admin.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{admin.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                      {getModuleLabel(admin.assignedModuleType)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--muted)' }}>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

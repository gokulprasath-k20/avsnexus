'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
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
    fetch(getApiUrl('/api/admin/users?role=moduleAdmin'))
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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 20px', gap: '8px', alignItems: 'center', background: 'var(--surface-hover)' }}>
          {['Admin', 'Module', ''].map((h) => (
            <span key={h} style={{ fontSize: '8px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 auto' }} />
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '10px' }}>No admins</div>
        ) : (
          admins.map((admin) => {
            const initials = admin.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <Link key={admin._id} href={`/superadmin/admins/${admin._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    padding: '5px 10px',
                    borderBottom: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 20px',
                    gap: '8px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '900', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '11px', fontVariationSettings: '"wght" 700', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.1' }}>{admin.name}</div>
                      <div style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{admin.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    <span style={{ display: 'inline-block', padding: '0px 4px', borderRadius: '3px', background: 'var(--foreground)', color: 'var(--background)', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {getModuleLabel(admin.assignedModuleType)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--muted)' }}>
                    <ArrowRight size={10} strokeWidth={3} />
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

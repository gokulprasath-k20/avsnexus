'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  totalPoints: number;
  isActive: boolean;
  assignedModules: Array<{ _id: string; name: string }>;
  createdAt: string;
}

const roleBadge: Record<string, { bg: string; text: string; label: string }> = {
  student: { bg: 'rgba(37,99,235,0.1)', text: '#2563eb', label: 'Student' },
  moduleAdmin: { bg: 'rgba(124,58,237,0.1)', text: '#7c3aed', label: 'Module Admin' },
  superAdmin: { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', label: 'Super Admin' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = () => {
    const url = roleFilter ? `/api/admin/users?role=${roleFilter}` : '/api/admin/users';
    fetch(url)
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  return (
    <AppShell title="Users" subtitle="Manage students and admins">
      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ value: '', label: 'All' }, { value: 'student', label: 'Students' }, { value: 'moduleAdmin', label: 'Module Admins' }, { value: 'superAdmin', label: 'Super Admins' }].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: roleFilter === opt.value ? 'var(--foreground)' : 'var(--surface)',
              color: roleFilter === opt.value ? 'var(--background)' : 'var(--muted-fg)',
              fontSize: '12.5px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '12px', alignItems: 'center' }}>
          {['User', 'Role', 'Points'].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>No users found.</div>
        ) : (
          users.map((user) => {
            const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            const badge = roleBadge[user.role] || roleBadge.student;
            return (
              <div
                key={user._id}
                style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '12px', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--foreground)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{user.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '500', color: badge.text, background: badge.bg, padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  {badge.label}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{user.totalPoints}</span>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

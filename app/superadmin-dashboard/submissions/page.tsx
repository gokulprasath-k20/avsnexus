'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import { ExternalLink, Check } from 'lucide-react';

interface Submission {
  _id: string;
  studentId: { name: string; email: string; department?: string; year?: number };
  taskId: { title: string; type: string; stage: string; points: number; submissionGuidelines?: string };
  status: string;
  score: number;
  fileUrl?: string;
  submittedAt: string;
}

export default function SuperAdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    fetch(getApiUrl('/api/submissions'))
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubmissions = submissions.filter((sub) => {
    if (departmentFilter && sub.studentId?.department !== departmentFilter) return false;
    if (yearFilter && sub.studentId?.year?.toString() !== yearFilter) return false;
    return true;
  });

  return (
    <AppShell title="All Submissions" subtitle="View and filter all student tasks">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
          >
            <option value="">All Departments</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map(y => (
              <option key={y} value={y.toString()}>Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <Check size={32} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>No submissions found</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSubmissions.map((sub) => (
            <div
              key={sub._id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 22px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>
                    {sub.taskId?.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                    {sub.studentId?.name} ({sub.studentId?.email}) •{' '}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted-fg)', background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '4px' }}>
                      {sub.studentId?.department || 'N/A'} Dept • Year {sub.studentId?.year || '?'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: sub.status === 'accepted' ? 'var(--success)' : sub.status === 'pending' || sub.status === 'needs_review' ? 'var(--warning)' : 'var(--danger)', background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '4px' }}>
                      {sub.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                {sub.fileUrl && (
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-hover)' }}
                  >
                    <ExternalLink size={12} /> View File
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

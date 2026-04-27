'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';

interface Student {
  _id: string;
  name: string;
  email: string;
  department?: string;
  year?: number;
  totalPoints: number;
  category?: 'elite' | 'non-elite';
}

export default function SuperAdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/users?role=student')
      .then((r) => r.json())
      .then((d) => setStudents(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter((s) => {
    if (departmentFilter && s.department !== departmentFilter) return false;
    if (yearFilter && s.year?.toString() !== yearFilter) return false;
    return true;
  });

  const eliteStudents = filteredStudents.filter((s) => s.category === 'elite');
  const nonEliteStudents = filteredStudents.filter((s) => s.category !== 'elite');

  const StudentTable = ({ title, data }: { title: string; data: Student[] }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '9px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title} <span style={{ opacity: 0.5, fontWeight: '400', marginLeft: '2px' }}>{data.length}</span>
        </h3>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 60px 40px 50px', gap: '8px', alignItems: 'center', background: 'var(--surface-hover)' }}>
          {['Student', 'Dept', 'Yr', 'Pts'].map((h) => (
            <span key={h} style={{ fontSize: '8px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {data.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)', fontSize: '10px' }}>Empty</div>
        ) : (
          data.map((student) => {
            const initials = student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div
                key={student._id}
                style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 60px 40px 50px', gap: '8px', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '900', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', fontVariationSettings: '"wght" 700', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.1' }}>{student.name}</div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{student.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--foreground)', textTransform: 'uppercase' }}>{student.department || '-'}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--foreground)' }}>{student.year ? (student.year === 1 ? 'I' : student.year === 2 ? 'II' : student.year === 3 ? 'III' : 'IV') : '-'}</div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--foreground)' }}>{student.totalPoints.toLocaleString()}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <AppShell title="Students" subtitle="Manage records">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>
          Total: <span style={{ color: 'var(--foreground)' }}>{filteredStudents.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
          >
            <option value="">Depts</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
          >
            <option value="">Year</option>
            {[1, 2, 3, 4].map(y => (
              <option key={y} value={y.toString()}>{y === 1 ? 'I' : y === 2 ? 'II' : y === 3 ? 'III' : 'IV'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          <StudentTable title="Elite" data={eliteStudents} />
          <StudentTable title="Non-Elite" data={nonEliteStudents} />
        </>
      )}
    </AppShell>
  );
}

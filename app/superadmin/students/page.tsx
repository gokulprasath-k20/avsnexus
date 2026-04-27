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
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--foreground)' }}>
          {title} <span style={{ color: 'var(--muted)', fontWeight: '400', marginLeft: '6px' }}>({data.length})</span>
        </h3>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px', gap: '16px', alignItems: 'center' }}>
          {['Student Info', 'Department', 'Year', 'Points'].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>No students in this category.</div>
        ) : (
          data.map((student) => {
            const initials = student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div
                key={student._id}
                style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px', gap: '16px', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{student.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--foreground)' }}>{student.department || '-'}</div>
                <div style={{ fontSize: '13px', color: 'var(--foreground)' }}>{student.year ? (student.year === 1 ? 'I' : student.year === 2 ? 'II' : student.year === 3 ? 'III' : 'IV') : '-'}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>{student.totalPoints.toLocaleString()}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <AppShell title="Students" subtitle="Manage student records">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>
          Total Students: <span style={{ color: 'var(--foreground)' }}>{filteredStudents.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All Departments</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map(y => (
              <option key={y} value={y.toString()}>Year {y === 1 ? 'I' : y === 2 ? 'II' : y === 3 ? 'III' : 'IV'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          <StudentTable title="Elite Students" data={eliteStudents} />
          <StudentTable title="Non-Elite Students" data={nonEliteStudents} />
        </>
      )}
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { Download, Filter, Search } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  registerNumber?: string;
  department?: string;
  year?: number;
  section?: string;
  email: string;
}

export default function StudentsListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState({
    year: 'ALL',
    department: 'ALL',
    section: 'ALL',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(getApiUrl(`/api/students-list?${query}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudents(data.students || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/export/students-list?${query}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Students_List_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AppShell title="Students List" subtitle="Full student records and tracking">
      <div style={{ marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
            <select 
              value={filters.department} 
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', outline: 'none' }}
            >
              <option value="ALL">All Departments</option>
              {['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Year</label>
            <select 
              value={filters.year} 
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', outline: 'none' }}
            >
              <option value="ALL">All Years</option>
              {[1, 2, 3, 4].map(y => <option key={y} value={y.toString()}>{y === 1 ? 'I' : y === 2 ? 'II' : y === 3 ? 'III' : 'IV'} Year</option>)}
            </select>
          </div>
          <div style={{ width: '100px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Section</label>
            <select 
              value={filters.section} 
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', outline: 'none' }}
            >
              <option value="ALL">All</option>
              {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            disabled={exportLoading}
            onClick={handleExport}
            style={{
              height: '37px', padding: '0 16px', background: 'var(--foreground)', color: 'var(--background)',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: exportLoading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', opacity: exportLoading ? 0.7 : 1
            }}
          >
            <Download size={16} />
            {exportLoading ? 'Generating...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-hover)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
              <tr>
                {['S.No', 'Student Name', 'Reg Number', 'Dept', 'Year', 'Sec', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: '900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>No students found matching filters.</td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)' }}>{student.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{student.email}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '800', color: 'var(--foreground)' }}>{student.registerNumber || '-'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700' }}>{student.department || '-'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700' }}>{student.year ? (student.year === 1 ? 'I' : student.year === 2 ? 'II' : student.year === 3 ? 'III' : 'IV') : '-'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '800' }}>{student.section || '-'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        onClick={() => {
                          const newPass = prompt(`Enter new password for ${student.name}:`, 'avsstudent123');
                          if (newPass && newPass.length >= 6) {
                            const handleReset = async () => {
                              try {
                                const res = await fetch(`/api/admin/users/${student._id}/reset-password`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ newPassword: newPass }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);
                                toast.success('Password updated!');
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            };
                            handleReset();
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: 'var(--foreground)',
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

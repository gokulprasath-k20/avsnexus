'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CheckCircle2, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

interface Module {
  _id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  isActive: boolean;
  assignedAdmins: Array<{ _id: string; name: string }>;
}

import { useAuth } from '@/contexts/AuthContext';

const typeLabels: Record<string, string> = {
  coding: 'Code Challenge',
  mcq: 'MCQ',
  file_upload: 'File Upload',
  design: 'Design',
};

export default function AdminModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [form, setForm] = useState({ name: '', description: '', type: user?.assignedModuleType || 'coding', icon: '📚' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (user?.assignedModuleType) {
      setForm((prev) => ({ ...prev, type: user.assignedModuleType! }));
    }
  }, [user?.assignedModuleType]);

  const fetchModules = () => {
    fetch(getApiUrl('/api/modules'), { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setModules(d.modules || []))
      .catch((err) => {
        console.error('Fetch modules failed:', err);
        toast.error('Failed to load modules');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchModules(); }, []);

  const handleAddTask = () => {
    setTasks([...tasks, {
      title: '',
      description: '',
      stage: 'easy',
      points: 10,
      duration: 0,
    }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: string, value: any) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const handleNewModuleClick = () => {
    setShowCreate(true);
    if (form.type === 'file_upload') {
      setTasks([{
        title: '', description: '', stage: 'easy', points: 10, topic: '', starterCode: '', options: [], allowedFormats: '.pdf,.pptx', maxFileSizeMB: 10, submissionGuidelines: ''
      }]);
    } else {
      setTasks([]);
    }
  };

  const createModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create the module
      const res = await fetch(getApiUrl('/api/modules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const moduleId = data.module._id;

      // 2. Create the tasks
      if (tasks.length > 0) {
        const taskPromises = tasks.map((t) => {
          const payload: any = {
            moduleId,
            title: t.title,
            description: t.description,
            type: form.type,
            stage: t.stage,
            points: Number(t.points),
            duration: Number(t.duration) || 0,
          };

          return fetch(getApiUrl('/api/tasks'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          }).then((r) => r.json());
        });

        await Promise.all(taskPromises);
      }

      toast.success(form.type === 'file_upload' ? 'Module and Topic created successfully!' : 'Module and questions created successfully!');
      setShowCreate(false);
      setForm({ ...form, name: '', description: '' });
      setTasks([]);
      fetchModules();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create module');
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Archive this module?')) return;
    try {
      await fetch(`/api/modules/${id}`, { method: 'DELETE' });
      toast.success('Module archived');
      fetchModules();
    } catch {
      toast.error('Failed to archive module');
    }
  };

  const adminLabel = user?.assignedModuleType === 'coding' ? 'CodeAdmin' : 
                     user?.assignedModuleType === 'mcq' ? 'DebugAdmin' : 
                     user?.assignedModuleType === 'file_upload' ? 'PresentAdmin' : 'Admin';

  return (
    <AppShell title={`${adminLabel} Dashboard`} subtitle={`Manage skill evaluation modules`}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={async () => {
            if (!user?.id) return;
            const btn = document.getElementById('export-btn');
            if (btn) btn.innerText = 'Exporting...';
            try {
              const res = await fetch(`/api/export/admin/${user.id}`);
              if (!res.ok) throw new Error('Export failed');
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Admin_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              toast.error('Failed to export report');
            } finally {
              if (btn) btn.innerText = 'Export My Report';
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'var(--surface)', color: 'var(--foreground)',
            border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.02em'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span id="export-btn">Export My Report</span>
        </button>

        <Link href="/admin-dashboard/notifications" style={{ textDecoration: 'none' }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', background: 'var(--surface)', color: 'var(--primary)',
              border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.02em'
            }}
          >
            <Bell size={13} /> Broadcast
          </button>
        </Link>

        <button
          onClick={handleNewModuleClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'var(--foreground)', color: 'var(--background)',
            border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.02em'
          }}
        >
          <Plus size={13} /> New Module
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' }}>New Module</h3>
          <form onSubmit={createModule}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. Web Dev' },
                { label: 'Icon', key: 'icon', type: 'text', placeholder: '📚' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={key === 'name'}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description..."
                required
                rows={2}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Type</label>
              <div style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--surface-hover)', color: 'var(--muted)', cursor: 'not-allowed', fontWeight: '600' }}>
                {typeLabels[form.type] || form.type} (Auto-assigned)
              </div>
            </div>

            {/* Questions Section */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--foreground)' }}>
                  {form.type === 'file_upload' ? 'Topic Details' : `Tasks (${tasks.length})`}
                </h4>
                {form.type !== 'file_upload' && (
                  <button type="button" onClick={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', color: 'var(--foreground)' }}>
                    <Plus size={12} /> Add Task
                  </button>
                )}
              </div>

              {tasks.map((task, idx) => (
                <div key={idx} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', marginBottom: '8px', position: 'relative' }}>
                  {form.type !== 'file_upload' && (
                    <button type="button" onClick={() => removeTask(idx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Title</label>
                      <input value={task.title} onChange={(e) => updateTask(idx, 'title', e.target.value)} required placeholder="Task Title" style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Stage</label>
                      <select value={task.stage} onChange={(e) => updateTask(idx, 'stage', e.target.value)} style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}>
                        <option value="easy">Easy</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Points</label>
                      <input type="number" value={task.points} onChange={(e) => updateTask(idx, 'points', Number(e.target.value))} min={1} style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Time Limit (Minutes)</label>
                      <input type="number" value={task.duration} onChange={(e) => updateTask(idx, 'duration', Number(e.target.value))} min={0} placeholder="0 = No limit" style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Question</label>
                    <textarea value={task.description} onChange={(e) => updateTask(idx, 'description', e.target.value)} required placeholder="Problem details..." rows={2} style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              <button type="submit" style={{ flex: 1, padding: '6px 16px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>
                Save Module
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '6px 12px', background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '40px 1fr 100px 80px', gap: '10px', alignItems: 'center', background: 'var(--surface-hover)' }}>
          {['Icon', 'Module', 'Type', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: '9px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 auto' }} />
          </div>
        ) : modules.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
            No modules found.
          </div>
        ) : (
          modules.filter(m => user?.role === 'superadmin' || m.type === user?.assignedModuleType).map((m) => (
            <div
              key={m._id}
              style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '40px 1fr 100px 80px', gap: '10px', alignItems: 'center' }}
            >
              <span style={{ fontSize: '18px' }}>{m.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--muted-fg)', background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase', border: '1px solid var(--border)', width: 'fit-content' }}>
                {m.type}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Link href={`/admin-dashboard/evaluate/${m._id}`}>
                  <button title="Evaluate Submissions" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--primary)', cursor: 'pointer', color: 'white' }}>
                    <CheckCircle2 size={12} />
                  </button>
                </Link>
                <Link href={`/admin-dashboard/modules/${m._id}`}>
                  <button title="Edit" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--muted-fg)' }}>
                    <Edit2 size={12} />
                  </button>
                </Link>
                <button
                  title="Archive"
                  onClick={() => deleteModule(m._id)}
                  style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--danger)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

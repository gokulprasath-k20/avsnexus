'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

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
    fetch('/api/modules')
      .then((r) => r.json())
      .then((d) => setModules(d.modules || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchModules(); }, []);

  const handleAddTask = () => {
    setTasks([...tasks, {
      title: '',
      description: '',
      stage: 'easy',
      points: 10,
      topic: '',
      starterCode: '',
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
      allowedFormats: '.pdf,.pptx',
      maxFileSizeMB: 10,
      submissionGuidelines: '',
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
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            topic: t.topic,
          };

          if (form.type === 'coding' && t.starterCode) {
            payload.starterCode = { python: t.starterCode };
          }
          if (form.type === 'mcq') {
            payload.options = t.options.filter((o: any) => o.text);
          }
          if (form.type === 'file_upload') {
            payload.allowedFormats = t.allowedFormats.split(',').map((f: string) => f.trim());
            payload.maxFileSizeMB = Number(t.maxFileSizeMB);
            payload.submissionGuidelines = t.submissionGuidelines;
          }

          return fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

  return (
    <AppShell title="Modules" subtitle="Manage all skill evaluation modules">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={handleNewModuleClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'var(--foreground)', color: 'var(--background)',
            border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> New Module
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Create New Module</h3>
          <form onSubmit={createModule}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { label: 'Module Name', key: 'name', type: 'text', placeholder: 'e.g. Web Development' },
                { label: 'Icon (emoji)', key: 'icon', type: 'text', placeholder: '📚' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={key === 'name'}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Module description..."
                required
                rows={3}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>Module Type</label>
              <div style={{ padding: '8px 12px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--surface-hover)', color: 'var(--muted)', cursor: 'not-allowed' }}>
                {typeLabels[form.type] || form.type} (Auto-assigned)
              </div>
            </div>

            {/* Questions Section */}
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>
                  {form.type === 'file_upload' ? 'Topic Details' : `Questions (${tasks.length})`}
                </h4>
                {form.type !== 'file_upload' && (
                  <button type="button" onClick={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--foreground)' }}>
                    <Plus size={14} /> Add Question
                  </button>
                )}
              </div>

              {tasks.map((task, idx) => (
                <div key={idx} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                  {form.type !== 'file_upload' && (
                    <button type="button" onClick={() => removeTask(idx)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  {form.type !== 'file_upload' && (
                    <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Question {idx + 1}</h5>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Title</label>
                      <input value={task.title} onChange={(e) => updateTask(idx, 'title', e.target.value)} required placeholder="Title" style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Stage</label>
                      <select value={task.stage} onChange={(e) => updateTask(idx, 'stage', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}>
                        <option value="easy">Easy</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Points</label>
                      <input type="number" value={task.points} onChange={(e) => updateTask(idx, 'points', Number(e.target.value))} min={1} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Topic / Category (optional)</label>
                      <input value={task.topic} onChange={(e) => updateTask(idx, 'topic', e.target.value)} placeholder="e.g. Innovation" style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Problem Statement / Prompt</label>
                    <textarea value={task.description} onChange={(e) => updateTask(idx, 'description', e.target.value)} required placeholder="Full description..." rows={3} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
                  </div>

                  {form.type === 'coding' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Starter Code (Python)</label>
                      <textarea value={task.starterCode} onChange={(e) => updateTask(idx, 'starterCode', e.target.value)} placeholder="def solution():\n    pass" rows={3} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
                    </div>
                  )}

                  {form.type === 'mcq' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>Options (check the correct one)</label>
                      {task.options.map((opt: any, optIdx: number) => (
                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input type="radio" name={`correct-${idx}`} checked={opt.isCorrect} onChange={() => {
                            const newOpts = task.options.map((o: any, i: number) => ({ ...o, isCorrect: i === optIdx }));
                            updateTask(idx, 'options', newOpts);
                          }} />
                          <input value={opt.text} onChange={(e) => {
                            const newOpts = task.options.map((o: any, i: number) => i === optIdx ? { ...o, text: e.target.value } : o);
                            updateTask(idx, 'options', newOpts);
                          }} required placeholder={`Option ${optIdx + 1}`} style={{ flex: 1, padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {form.type === 'file_upload' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Submission Guidelines</label>
                      <textarea value={task.submissionGuidelines} onChange={(e) => updateTask(idx, 'submissionGuidelines', e.target.value)} placeholder="Instructions..." rows={2} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button type="submit" style={{ padding: '8px 18px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '7px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer' }}>
                {form.type === 'file_upload' ? 'Create Module & Topic' : `Create Module ${tasks.length > 0 ? `& ${tasks.length} Questions` : ''}`}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 18px', background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '13.5px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '50px 1fr 120px 160px 120px', gap: '12px', alignItems: 'center' }}>
          {['Icon', 'Module', 'Type', 'Admins', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
          </div>
        ) : modules.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            No modules yet. Create your first one!
          </div>
        ) : (
          modules.map((m) => (
            <div
              key={m._id}
              style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '50px 1fr 120px 160px 120px', gap: '12px', alignItems: 'center' }}
            >
              <span style={{ fontSize: '22px' }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--foreground)' }}>{m.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{m.description}</div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted-fg)', background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                {typeLabels[m.type] || m.type}
              </span>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {m.assignedAdmins.length === 0 ? 'None' : m.assignedAdmins.map((a) => a.name).join(', ')}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Link href={`/admin/modules/${m._id}`}>
                  <button title="Edit" style={{ padding: '5px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--muted-fg)' }}>
                    <Edit2 size={13} />
                  </button>
                </Link>
                <button
                  title="Archive"
                  onClick={() => deleteModule(m._id)}
                  style={{ padding: '5px', border: '1px solid var(--border)', borderRadius: '5px', background: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--danger)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

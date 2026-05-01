'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

interface Task {
  _id: string;
  title: string;
  type: string;
  stage: string;
  points: number;
}

interface Module {
  _id: string;
  name: string;
  type: string;
  description: string;
}

const TASK_STAGES = ['easy', 'intermediate', 'expert'];

export default function AdminModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeStage, setActiveStage] = useState('easy');

  const [form, setForm] = useState({
    title: '',
    description: '',
    stage: 'easy',
    points: 10,
    topic: '',
    // Coding
    starterCode: '',
    // MCQ
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
    // File upload
    allowedFormats: '.pdf,.pptx',
    maxFileSizeMB: 10,
    submissionGuidelines: '',
  });

  const fetchData = () => {
    Promise.all([
      fetch(getApiUrl(`/api/modules/${id}`)).then((r) => r.json()),
      fetch(getApiUrl(`/api/tasks?moduleId=${id}`)).then((r) => r.json()),
    ]).then(([modData, taskData]) => {
      setModule(modData.module);
      setTasks(taskData.tasks || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const moduleType = module?.type;
    const payload: Record<string, unknown> = {
      moduleId: id,
      title: form.title,
      description: form.description,
      type: moduleType,
      stage: form.stage,
      points: Number(form.points),
      topic: form.topic,
    };

    if (moduleType === 'coding' && form.starterCode) {
      payload.starterCode = { python: form.starterCode };
    }
    if (moduleType === 'mcq') {
      payload.options = form.options.filter((o) => o.text);
    }
    if (moduleType === 'file_upload') {
      payload.allowedFormats = form.allowedFormats.split(',').map((f) => f.trim());
      payload.maxFileSizeMB = Number(form.maxFileSizeMB);
      payload.submissionGuidelines = form.submissionGuidelines;
    }

    try {
      const res = await fetch(getApiUrl('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Task created!');
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    toast.success('Task deleted');
    fetchData();
  };

  if (loading || !module) {
    return (
      <AppShell title="Module Detail">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      </AppShell>
    );
  }

  const stageTasks = tasks.filter((t) => t.stage === activeStage);
  const stageColor = { easy: 'var(--success)', intermediate: 'var(--warning)', expert: 'var(--danger)' };

  return (
    <AppShell title={module.name} subtitle={`Manage tasks for this ${module.type} module`}>
      <Link href="/admin-dashboard/modules" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', textDecoration: 'none', marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back to modules
      </Link>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer' }}
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Task create form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>New Task</h3>
          <form onSubmit={createTask}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Task title" style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Stage</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}>
                  {TASK_STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Points</label>
                <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} min={1} style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Topic (optional)</label>
                <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Arrays, Sorting..." style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Description / Problem Statement</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Full problem description..." rows={4} style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
            </div>

            {module.type === 'coding' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Starter Code (Python)</label>
                <textarea value={form.starterCode} onChange={(e) => setForm({ ...form, starterCode: e.target.value })} placeholder="def solution():&#10;    pass" rows={4} style={{ width: '100%', padding: '7px 10px', fontSize: '13px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            {module.type === 'mcq' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: 'var(--foreground)' }}>Options (check the correct one)</label>
                {form.options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setForm({ ...form, options: form.options.map((o, i) => ({ ...o, isCorrect: i === idx })) })} />
                    <input value={opt.text} onChange={(e) => setForm({ ...form, options: form.options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o) })} placeholder={`Option ${idx + 1}`} style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
                  </div>
                ))}
              </div>
            )}

            {module.type === 'file_upload' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--foreground)' }}>Submission Guidelines</label>
                <textarea value={form.submissionGuidelines} onChange={(e) => setForm({ ...form, submissionGuidelines: e.target.value })} placeholder="Instructions for students..." rows={3} style={{ width: '100%', padding: '7px 10px', fontSize: '13.5px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ padding: '8px 18px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '7px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer' }}>Create Task</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 14px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '13.5px', cursor: 'pointer', color: 'var(--muted-fg)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TASK_STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStage(s)}
            style={{
              padding: '7px 18px', borderRadius: '8px',
              border: `1px solid ${activeStage === s ? stageColor[s as keyof typeof stageColor] : 'var(--border)'}`,
              background: activeStage === s ? `${stageColor[s as keyof typeof stageColor]}12` : 'var(--surface)',
              color: activeStage === s ? stageColor[s as keyof typeof stageColor] : 'var(--muted-fg)',
              fontSize: '13px', fontWeight: activeStage === s ? '600' : '400', cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {s} ({tasks.filter((t) => t.stage === s).length})
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stageTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--muted)', fontSize: '13px' }}>
            No tasks in this stage. Add one above.
          </div>
        ) : (
          stageTasks.map((task) => (
            <div
              key={task._id}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--foreground)' }}>{task.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>+{task.points} pts</div>
              </div>
              <button
                onClick={() => deleteTask(task._id)}
                style={{ padding: '5px', border: '1px solid var(--border)', borderRadius: '5px', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { ArrowLeft, Plus, Trash2, Code2, ListTodo, FileText, ChevronDown, ChevronUp, Beaker } from 'lucide-react';
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
const LANGUAGES = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'Node.js' },
];

export default function ModuleAdminClient() {
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
    // Coding specific
    allowedLanguages: [] as string[],
    starterCode: {} as Record<string, string>,
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
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

  const toggleLanguage = (lang: string) => {
    setForm(prev => {
      const allowed = [...prev.allowedLanguages];
      if (allowed.includes(lang)) {
        return { ...prev, allowedLanguages: allowed.filter(l => l !== lang) };
      } else {
        return { ...prev, allowedLanguages: [...allowed, lang] };
      }
    });
  };

  const addTestCase = () => {
    setForm(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', isHidden: false }]
    }));
  };

  const removeTestCase = (idx: number) => {
    setForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== idx)
    }));
  };

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

    if (moduleType === 'coding') {
      payload.allowedLanguages = form.allowedLanguages;
      payload.testCases = form.testCases.filter(tc => tc.input || tc.expectedOutput);
      payload.starterCode = form.starterCode;
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
    await fetch(getApiUrl(`/api/tasks/${taskId}`), { method: 'DELETE' });
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
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <Plus size={16} /> Add New Task
        </button>
      </div>

      {/* Task create form */}
      {showForm && (
        <div className="glass-panel" style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '24px', textTransform: 'uppercase', tracking: 'tight' }}>Create {module.type} Task</h3>
          <form onSubmit={createTask}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Task title" style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Stage</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}>
                  {TASK_STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Points</label>
                <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} min={1} style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Topic</label>
                <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Arrays, Sorting..." style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Description / Problem Statement</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Full problem description..." rows={4} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
            </div>

            {module.type === 'coding' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Allowed Languages & Starter Code</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => toggleLanguage(lang.value)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: '1px solid var(--border)',
                          background: form.allowedLanguages.includes(lang.value) ? 'var(--primary)' : 'var(--background)',
                          color: form.allowedLanguages.includes(lang.value) ? 'white' : 'var(--foreground)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  {form.allowedLanguages.map(lang => (
                    <div key={lang} style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', marginBottom: '4px', color: 'var(--muted)' }}>Starter Code ({LANGUAGES.find(l => l.value === lang)?.label})</label>
                      <textarea
                        value={form.starterCode[lang] || ''}
                        onChange={(e) => setForm({ ...form, starterCode: { ...form.starterCode, [lang]: e.target.value } })}
                        placeholder={`// Starter code for ${lang}...`}
                        rows={3}
                        style={{ width: '100%', padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: 'var(--muted)', textTransform: 'uppercase' }}>Test Cases</label>
                    <button type="button" onClick={addTestCase} style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={12} /> ADD CASE
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {form.testCases.map((tc, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 40px', gap: '10px', alignItems: 'center', background: 'var(--background)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <input value={tc.input} onChange={(e) => setForm({ ...form, testCases: form.testCases.map((t, i) => i === idx ? { ...t, input: e.target.value } : t) })} placeholder="Input" style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                        <input value={tc.expectedOutput} onChange={(e) => setForm({ ...form, testCases: form.testCases.map((t, i) => i === idx ? { ...t, expectedOutput: e.target.value } : t) })} placeholder="Output" style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700', color: 'var(--muted)' }}>
                          <input type="checkbox" checked={tc.isHidden} onChange={(e) => setForm({ ...form, testCases: form.testCases.map((t, i) => i === idx ? { ...t, isHidden: e.target.checked } : t) })} /> HIDDEN
                        </label>
                        <button type="button" onClick={() => removeTestCase(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {module.type === 'mcq' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '8px', color: 'var(--muted)', textTransform: 'uppercase' }}>Options (Select the correct one)</label>
                {form.options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setForm({ ...form, options: form.options.map((o, i) => ({ ...o, isCorrect: i === idx })) })} />
                    <input value={opt.text} onChange={(e) => setForm({ ...form, options: form.options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o) })} placeholder={`Option ${idx + 1}`} style={{ flex: 1, padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
                  </div>
                ))}
              </div>
            )}

            {module.type === 'file_upload' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Submission Guidelines</label>
                <textarea value={form.submissionGuidelines} onChange={(e) => setForm({ ...form, submissionGuidelines: e.target.value })} placeholder="Instructions for students..." rows={3} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button type="submit" style={{ padding: '12px 24px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>Save Task</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', color: 'var(--muted)', textTransform: 'uppercase' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--surface)', padding: '5px', borderRadius: '14px', width: 'fit-content', border: '1px solid var(--border)' }}>
        {TASK_STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStage(s)}
            style={{
              padding: '8px 24px', borderRadius: '10px',
              border: 'none',
              background: activeStage === s ? 'var(--background)' : 'transparent',
              boxShadow: activeStage === s ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              color: activeStage === s ? 'var(--foreground)' : 'var(--muted)',
              fontSize: '12px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s'
            }}
          >
            {s} ({tasks.filter((t) => t.stage === s).length})
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {stageTasks.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--muted)', fontSize: '14px', fontWeight: '600' }}>
            No tasks found in this stage.
          </div>
        ) : (
          stageTasks.map((task) => (
            <div
              key={task._id}
              className="glass-panel"
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', transition: 'transform 0.2s' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--background)', display: 'flex', alignItems: 'center', justify: 'center', border: '1px solid var(--border)' }}>
                {task.type === 'coding' ? <Code2 size={20} /> : task.type === 'mcq' ? <ListTodo size={20} /> : <FileText size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--foreground)', textTransform: 'uppercase' }}>{task.title}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', marginTop: '4px' }}>+{task.points} PTS • {task.type}</div>
              </div>
              <button
                onClick={() => deleteTask(task._id)}
                style={{ p: '8px', borderRadius: '10px', background: 'var(--danger)10', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

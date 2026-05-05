'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  stage: string;
  points: number;
  topic?: string;
  isCompleted?: boolean;
}

interface Module {
  _id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  stageConfig: {
    easy: { count: number; pointsPerTask: number };
    intermediate: { count: number; pointsPerTask: number };
    expert: { count: number; pointsPerTask: number };
  };
}

const stageColors: Record<string, string> = {
  easy: 'var(--success)',
  intermediate: 'var(--warning)',
  expert: 'var(--danger)',
};

export default function ModuleClient() {
  const { id } = useParams<{ id: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [activeStage, setActiveStage] = useState('easy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/modules/${id}`).then((r) => r.json()),
      fetch(`/api/tasks?moduleId=${id}`).then((r) => r.json()),
      fetch(`/api/submissions?moduleId=${id}`).then((r) => r.json()),
    ]).then(([modData, taskData, subData]) => {
      setModule(modData.module);
      setTasks(taskData.tasks || []);
      
      const completed = new Set<string>();
      (subData.submissions || []).forEach((s: any) => {
        if (s.status === 'pass' || s.status === 'accepted' || s.status === 'needs_review') {
          completed.add(typeof s.taskId === 'object' ? s.taskId._id : s.taskId);
        }
      });
      setCompletedTaskIds(completed);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Module" subtitle="Loading...">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      </AppShell>
    );
  }

  if (!module) {
    return (
      <AppShell title="Module not found">
        <p style={{ color: 'var(--muted)' }}>This module does not exist.</p>
      </AppShell>
    );
  }

  const stageTasks = tasks.filter((t) => t.stage === activeStage);
  const stages = ['easy', 'intermediate', 'expert'];

  return (
    <AppShell title={module.name} subtitle={module.description}>
      {/* Back */}
      <Link
        href="/modules"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', textDecoration: 'none', marginBottom: '20px' }}
      >
        <ArrowLeft size={14} /> Back to modules
      </Link>

      {/* Header card - Compact */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '32px' }}>{module.icon || '📚'}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--foreground)', marginBottom: '2px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            {module.name}
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500', lineHeight: '1.4', marginBottom: '8px' }}>
            {module.description}
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {stages.map((stage) => {
              const config = module.stageConfig?.[stage as keyof typeof module.stageConfig];
              return (
                <div
                  key={stage}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--surface-hover)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '8px', color: stageColors[stage], fontWeight: '900', textTransform: 'uppercase', marginBottom: '0px' }}>
                    {stage.slice(0, 3)}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--foreground)', lineHeight: '1' }}>
                    {config?.count || 0}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--muted)', fontWeight: '800' }}>
                    {config?.pointsPerTask || 0}P
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Stage Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shrink-0 ${
              activeStage === stage
                ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted-fg)]'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Available Tasks Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <h3 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Available Tasks</h3>
            <div className="h-[1px] flex-1 bg-[var(--border)] opacity-30"></div>
          </div>

          {stageTasks.filter(t => !completedTaskIds.has(t._id)).length === 0 ? (
            <div className="p-6 glass-panel rounded-xl text-center border-dashed opacity-50">
              <p className="text-[9px] text-[var(--muted)] font-black uppercase tracking-tighter">No pending tasks in this stage</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              {stageTasks.filter(t => !completedTaskIds.has(t._id)).map((task, index) => {
                const taskLink = task.type === 'coding' ? `/playground/${task._id}` : `/tasks/${task._id}`;
                return (
                  <Link key={task._id} href={taskLink} className="no-underline group">
                    <div className="glass-panel rounded-xl p-2.5 flex items-center justify-between hover:border-[var(--primary)]/50 bg-[var(--surface)] active:scale-[0.99] transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-6 h-6 rounded bg-[var(--surface-hover)] text-[var(--muted)] flex items-center justify-center text-[10px] font-black shrink-0 border border-[var(--border)]">
                          {(index + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-[11px] font-extrabold text-[var(--foreground)] leading-tight truncate uppercase tracking-tight">
                            {task.title}
                          </h4>
                          <p className="text-[7px] text-[var(--muted)] font-black uppercase tracking-tighter">
                            {task.points} Points Available
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={10} className="text-[var(--primary)] opacity-40 group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Tasks Section */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <h3 className="text-[9px] font-black text-[var(--success)] uppercase tracking-[0.2em]">Completed</h3>
            <div className="h-[1px] flex-1 bg-[var(--success)] opacity-10"></div>
          </div>

          {stageTasks.filter(t => completedTaskIds.has(t._id)).length === 0 ? (
            <div className="p-4 rounded-xl border border-[var(--border)] border-dashed text-center opacity-30">
              <p className="text-[8px] text-[var(--muted)] font-black uppercase">None completed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 opacity-70">
              {stageTasks.filter(t => completedTaskIds.has(t._id)).map((task) => (
                <div 
                  key={task._id} 
                  className="glass-panel rounded-xl p-2.5 flex items-center justify-between bg-[var(--surface-hover)]/30 border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center shrink-0 border border-[var(--success)]/20">
                      <CheckCircle size={10} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-[var(--muted-fg)] leading-tight truncate uppercase">
                        {task.title}
                      </h4>
                      <p className="text-[7px] text-[var(--success)] font-black uppercase">
                        Mastered (+{task.points}P)
                      </p>
                    </div>
                  </div>
                  <Lock size={10} className="text-[var(--muted)] opacity-50" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

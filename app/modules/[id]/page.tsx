'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle, Circle, ChevronRight } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  stage: string;
  points: number;
  topic?: string;
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

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeStage, setActiveStage] = useState('easy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/modules/${id}`).then((r) => r.json()),
      fetch(`/api/tasks?moduleId=${id}`).then((r) => r.json()),
    ]).then(([modData, taskData]) => {
      setModule(modData.module);
      setTasks(taskData.tasks || []);
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

      {/* Stage tabs - Tiny */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: `1px solid ${activeStage === stage ? 'var(--foreground)' : 'var(--border)'}`,
              background: activeStage === stage ? 'var(--foreground)' : 'var(--surface)',
              color: activeStage === stage ? 'var(--background)' : 'var(--muted-fg)',
              fontSize: '10px',
              fontWeight: '900',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.1s',
            }}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Tasks list - High Density */}
      {stageTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: '700' }}>NO TASKS</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {stageTasks.map((task, index) => (
            <Link key={task._id} href={`/tasks/${task._id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--foreground)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                }}
              >
                <div style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: '900', width: '18px' }}>
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--foreground)', textTransform: 'uppercase' }}>
                    {task.title}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: stageColors[task.stage], background: `${stageColors[task.stage]}12`, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                    {task.points}P
                  </span>
                  <ChevronRight size={10} strokeWidth={3} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

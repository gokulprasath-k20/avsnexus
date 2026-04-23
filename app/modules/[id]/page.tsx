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

      {/* Header card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '48px' }}>{module.icon || '📚'}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            {module.name}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '16px' }}>
            {module.description}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {stages.map((stage) => {
              const config = module.stageConfig?.[stage as keyof typeof module.stageConfig];
              return (
                <div
                  key={stage}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--surface-hover)',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: stageColors[stage], fontWeight: '600', textTransform: 'capitalize', marginBottom: '4px' }}>
                    {stage}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)' }}>
                    {config?.count || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {config?.pointsPerTask || 0} pts each
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              border: `1px solid ${activeStage === stage ? stageColors[stage] : 'var(--border)'}`,
              background: activeStage === stage ? `${stageColors[stage]}12` : 'var(--surface)',
              color: activeStage === stage ? stageColors[stage] : 'var(--muted-fg)',
              fontSize: '13px',
              fontWeight: activeStage === stage ? '600' : '400',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {stageTasks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            No tasks available for this stage yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stageTasks.map((task, index) => (
            <Link
              key={task._id}
              href={`/tasks/${task._id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                }}
              >
                <div style={{ color: 'var(--border-strong)', flexShrink: 0 }}>
                  <Circle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>
                    {index + 1}. {task.title}
                  </div>
                  {task.topic && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      {task.topic}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: stageColors[task.stage],
                      background: `${stageColors[task.stage]}12`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    +{task.points} pts
                  </span>
                  <ChevronRight size={15} style={{ color: 'var(--muted)' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

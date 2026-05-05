'use client';

import React, { useEffect, useState, use } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  moduleId?: { name: string };
  stage: string;
  topic?: string;
  createdAt: string;
}

import { useParams } from 'next/navigation';

export default function AdminClient() {
  const { id: adminId } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks?createdBy=${adminId}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .finally(() => setLoading(false));
  }, [adminId]);

  return (
    <AppShell title="Admin Details" subtitle="Tasks created by this admin">
      <div style={{ marginBottom: '24px' }}>
        <Link href="/superadmin/admins" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Admins
        </Link>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr', gap: '16px', alignItems: 'center' }}>
          {['Task Title', 'Module', 'Stage', 'Topic', 'Created Date'].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            No tasks created by this admin yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {task.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {task.moduleId?.name || 'Unknown Module'}
              </div>
              <div>
                <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', background: 'var(--surface-hover)', color: 'var(--foreground)', fontSize: '11px', fontWeight: '500', textTransform: 'capitalize' }}>
                  {task.stage}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {task.topic || '-'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import DeadlineCountdown from '@/components/DeadlineCountdown';
import {
  CheckCircle2, Clock, XCircle, ArrowRight,
  Code2, FileText, Cpu, ChevronRight, RotateCcw,
  Zap, Trophy,
} from 'lucide-react';

type Tab = 'available' | 'completed' | 'failed';

interface StudentTask {
  _id: string;
  status: Tab;
  deadlineTime?: string;
  taskId: {
    _id: string;
    title: string;
    description: string;
    type: string;
    stage: string;
    points: number;
    allowedLanguages?: string[];
    duration?: number;
    moduleId?: { _id: string; name: string };
    topic?: string;
  };
}

const STAGE_COLOR: Record<string, string> = {
  easy: '#22c55e',
  intermediate: '#f59e0b',
  expert: '#ef4444',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  coding: <Code2 size={12} strokeWidth={2.5} />,
  mcq: <Cpu size={12} strokeWidth={2.5} />,
  file_upload: <FileText size={12} strokeWidth={2.5} />,
};

const TAB_CONFIG = [
  {
    key: 'available' as Tab,
    label: 'Available',
    icon: <Clock size={13} strokeWidth={2.5} />,
    color: 'var(--primary)',
    emptyIcon: '📭',
    emptyMsg: 'No tasks available right now',
    emptyHint: 'New tasks will appear here when your admin adds them.',
  },
  {
    key: 'completed' as Tab,
    label: 'Completed',
    icon: <CheckCircle2 size={13} strokeWidth={2.5} />,
    color: '#22c55e',
    emptyIcon: '🏆',
    emptyMsg: 'No completed tasks yet',
    emptyHint: 'Complete tasks to see them here.',
  },
  {
    key: 'failed' as Tab,
    label: 'Failed',
    icon: <XCircle size={13} strokeWidth={2.5} />,
    color: '#ef4444',
    emptyIcon: '😌',
    emptyMsg: 'No failed tasks',
    emptyHint: "Great job keeping up with deadlines!",
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [tabCounts, setTabCounts] = useState({ available: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = useCallback(async (tab: Tab, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/student-tasks?tab=${tab}`), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.studentTasks || []);
        if (data.tabCounts) setTabCounts(data.tabCounts);
      }
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  // Initial load + tab switch
  useEffect(() => {
    fetchTasks(activeTab);
  }, [activeTab, fetchTasks]);

  // Polling every 30s for real-time updates
  useEffect(() => {
    pollRef.current = setInterval(() => fetchTasks(activeTab, true), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTab, fetchTasks]);

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;

  return (
    <AppShell title="My Tasks" subtitle="Track your progress">
      {/* ── Header ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--foreground)', lineHeight: 1 }}>
              {user?.name?.split(' ')[0] ?? 'Student'}&apos;s Tasks
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              {user?.totalPoints ?? 0} pts · {user?.department ?? ''} {user?.year ? `Year ${user.year}` : ''}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '6px 10px',
          }}>
            <Trophy size={12} strokeWidth={2.5} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--foreground)' }}>
              {user?.totalPoints ?? 0}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>pts</span>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px',
        }}>
          {TAB_CONFIG.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: activeTab === t.key ? t.color : 'var(--surface)',
                border: `1px solid ${activeTab === t.key ? t.color : 'var(--border)'}`,
                borderRadius: '10px', padding: '8px',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}
            >
              <span style={{
                fontSize: '16px', fontWeight: '900',
                color: activeTab === t.key ? 'white' : 'var(--foreground)',
              }}>
                {(tabCounts as any)[t.key]}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: activeTab === t.key ? 'rgba(255,255,255,0.85)' : 'var(--muted)',
              }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Selector ── */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '14px',
        borderBottom: '1px solid var(--border)', paddingBottom: '0',
      }}>
        {TAB_CONFIG.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 12px', fontSize: '11px', fontWeight: '800',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.key ? t.color : 'transparent'}`,
              color: activeTab === t.key ? t.color : 'var(--muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {t.icon}
            {t.label}
            {(tabCounts as any)[t.key] > 0 && (
              <span style={{
                background: activeTab === t.key ? t.color : 'var(--border)',
                color: activeTab === t.key ? 'white' : 'var(--muted)',
                borderRadius: '10px', padding: '0px 5px',
                fontSize: '9px', fontWeight: '900',
              }}>
                {(tabCounts as any)[t.key]}
              </span>
            )}
          </button>
        ))}

        {/* Refresh button */}
        <button
          onClick={() => fetchTasks(activeTab)}
          title="Refresh"
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'var(--muted)', cursor: 'pointer', padding: '8px',
          }}
        >
          <RotateCcw size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Task List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: '90px', borderRadius: '12px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--surface)', borderRadius: '16px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {activeTabConfig.emptyIcon}
          </div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '4px' }}>
            {activeTabConfig.emptyMsg}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {activeTabConfig.emptyHint}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map((st) => {
            const task = st.taskId;
            if (!task) return null;

            const isLocked = st.status === 'failed';
            const isCompleted = st.status === 'completed';

            return (
              <Link
                key={st._id}
                href={isLocked ? '#' : `/tasks/${task._id}`}
                onClick={(e) => isLocked && e.preventDefault()}
                style={{ textDecoration: 'none', color: 'inherit', opacity: isLocked ? 0.7 : 1 }}
              >
                <div
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '14px', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.15s',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    borderLeft: `3px solid ${isCompleted ? '#22c55e' : isLocked ? '#ef4444' : 'var(--primary)'}`,
                  }}
                  onMouseEnter={(e) => !isLocked && (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  {/* Type icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: isCompleted ? 'rgba(34,197,94,0.1)' : isLocked ? 'rgba(239,68,68,0.1)' : 'var(--primary-fade)',
                    color: isCompleted ? '#22c55e' : isLocked ? '#ef4444' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isCompleted ? <CheckCircle2 size={16} strokeWidth={2.5} /> :
                     isLocked ? <XCircle size={16} strokeWidth={2.5} /> :
                     TYPE_ICON[task.type] || <Zap size={14} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: '800',
                        color: 'var(--foreground)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '160px',
                      }}>
                        {task.title}
                      </span>
                      <span style={{
                        fontSize: '8px', fontWeight: '900', textTransform: 'uppercase',
                        color: STAGE_COLOR[task.stage] || 'var(--muted)',
                        background: `${STAGE_COLOR[task.stage]}18`,
                        padding: '1px 5px', borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}>
                        {task.stage}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {task.moduleId && (
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>
                          {task.moduleId.name}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>
                        ⚡ {task.points} pts
                      </span>
                      {/* Deadline countdown */}
                      {st.deadlineTime && !isCompleted && (
                        <DeadlineCountdown
                          deadlineTime={st.deadlineTime}
                          status={st.status}
                          compact
                        />
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!isLocked && (
                    <ChevronRight size={14} strokeWidth={2.5} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

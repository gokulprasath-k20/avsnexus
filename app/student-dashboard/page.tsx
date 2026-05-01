'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Trophy, CheckCircle, Clock, TrendingUp, ArrowRight, Star } from 'lucide-react';

interface Module {
  _id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
}

interface Task {
  _id: string;
  moduleId: string;
  title: string;
}

interface Submission {
  _id: string;
  taskId: { _id: string; title: string };
  status: string;
  submittedAt: string;
}

interface StatsCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalTasks, setTotalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, subRes, taskRes] = await Promise.all([
          fetch(getApiUrl('/api/modules')),
          fetch(getApiUrl('/api/submissions')),
          fetch(getApiUrl('/api/tasks'))
        ]);
        
        const modData = await modRes.json();
        const subData = await subRes.json();
        const taskData = await taskRes.json();

        setModules(modData.modules || []);
        
        // Filter submissions that are completed (pass or accepted)
        const completedSubs = (subData.submissions || []).filter((s: any) => 
          s.status === 'pass' || s.status === 'accepted' || s.status === 'needs_review'
        );
        setSubmissions(completedSubs);
        
        setTotalTasks(taskData.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedTaskIds = new Set(submissions.map(s => typeof s.taskId === 'object' ? s.taskId._id : s.taskId));
  const completedCount = completedTaskIds.size;
  const availableCount = totalTasks.length - completedCount;



  const moduleTypeColors: Record<string, string> = {
    coding: '#1d4ed8',
    mcq: '#7c3aed',
    file_upload: '#059669',
    design: '#d97706',
  };

  const moduleTypeLabels: Record<string, string> = {
    coding: 'Code Challenge',
    mcq: 'MCQ',
    file_upload: 'File Upload',
    design: 'Design',
  };


  const stats: StatsCard[] = [
    {
      label: 'Points',
      value: (user?.totalPoints || 0).toLocaleString(),
      icon: <Star size={14} />,
      color: 'var(--warning)',
    },
    {
      label: 'Available',
      value: Math.max(0, availableCount),
      icon: <BookOpen size={14} />,
      color: 'var(--primary)',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: <CheckCircle size={14} />,
      color: 'var(--success)',
    },
    {
      label: 'Streak',
      value: `${user?.currentStreak || 0}D`,
      icon: <TrendingUp size={14} />,
      color: 'var(--danger)',
    },
  ];

  // Filtering for Available Tasks (pending)
  const availableTasks = totalTasks.filter(t => !completedTaskIds.has(t._id));
  
  const getModuleInfo = (moduleId: string) => {
    return modules.find(m => m._id === moduleId);
  };

  return (
    <AppShell
      title={`Hi, ${user?.name?.split(' ')[0]} 👋`}
      subtitle={`${user?.registerNumber || ''} • ${user?.department || ''}`}
    >
      {/* Stats row - Ultra Compact Sticky-ready */}
      <div className="grid grid-cols-4 gap-1 mb-4 sticky top-0 z-10 py-2 bg-[var(--background)]/80 backdrop-blur-md">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-panel rounded-xl p-2.5 flex flex-col items-center justify-center text-center border border-[var(--border)]"
          >
            <div className="mb-0.5" style={{ color: stat.color }}>{stat.icon}</div>
            <p className="text-[14px] font-black text-[var(--foreground)] tracking-tight leading-none mb-0.5">
              {stat.value}
            </p>
            <p className="text-[7px] text-[var(--muted)] uppercase tracking-widest font-black">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-6 pb-20">
        {/* Available Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
              <Clock size={10} /> Available Tasks ({availableTasks.length})
            </h3>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 glass-panel rounded-xl animate-pulse" />
              ))}
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="glass-panel rounded-xl p-6 text-center border-dashed">
              <Trophy size={24} className="mx-auto mb-2 text-[var(--warning)] opacity-50" />
              <p className="text-[10px] text-[var(--muted)] font-black uppercase">All Caught Up! Great Job.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {availableTasks.slice(0, 8).map((task) => {
                const module = getModuleInfo(task.moduleId);
                const taskLink = module?.type === 'coding' ? `/playground/${task._id}` : `/tasks/${task._id}`;
                return (
                  <Link key={task._id} href={taskLink} className="no-underline group">
                    <div className="glass-panel rounded-xl p-3 flex items-center justify-between hover:border-[var(--primary)]/50 transition-all active:scale-[0.98]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 text-sm">
                          {module?.icon || '📝'}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-[12px] font-black text-[var(--foreground)] leading-tight truncate">
                            {task.title}
                          </h4>
                          <p className="text-[8px] text-[var(--muted)] font-black uppercase tracking-tight truncate">
                            {module?.name || 'Skill Module'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[8px] font-black text-[var(--muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-md border border-[var(--border)] uppercase">
                          Pending
                        </span>
                        <ArrowRight size={12} className="text-[var(--primary)] opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Skill Modules Quick Access - Compact Carousel-style grid */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={10} /> Skill Modules
            </h3>
            <Link href="/modules" className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">
              View All
            </Link>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {modules.map((module) => (
              <Link key={module._id} href={`/modules/${module._id}`} className="shrink-0 w-[140px] no-underline">
                <div className="glass-panel rounded-xl p-3 h-full border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                  <div className="text-lg mb-1">{module.icon}</div>
                  <h4 className="text-[10px] font-black text-[var(--foreground)] leading-tight mb-1 line-clamp-1">{module.name}</h4>
                  <div className="text-[7px] font-black text-[var(--muted)] uppercase">
                    {totalTasks.filter(t => t.moduleId === module._id && !completedTaskIds.has(t._id)).length} Available
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Completed Tasks History - High Density */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={10} /> Recently Completed
            </h3>
          </div>

          {submissions.length === 0 ? (
            <div className="glass-panel rounded-xl p-6 text-center border-dashed opacity-50">
              <p className="text-[9px] text-[var(--muted)] font-black uppercase">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {submissions.slice(0, 5).map((sub) => (
                <div 
                  key={sub._id}
                  className="glass-panel rounded-xl p-2.5 flex items-center justify-between bg-[var(--surface)]/30 border border-[var(--border)] opacity-80"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center shrink-0">
                      <CheckCircle size={12} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-[var(--foreground)] leading-tight truncate">
                        {sub.taskId?.title || 'Task'}
                      </p>
                      <p className="text-[7px] text-[var(--muted)] font-black uppercase tracking-tighter">
                        Done {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-[7px] font-black text-[var(--success)] bg-[var(--success)]/10 px-1.5 py-0.5 rounded uppercase border border-[var(--success)]/20">
                    Verified
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Search, Filter, ArrowRight, BookOpen } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface Module {
  _id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  stageConfig: {
    easy: { count: number; pointsPerTask: number };
    intermediate: { count: number; pointsPerTask: number };
    expert: { count: number; pointsPerTask: number };
  };
}

const typeColors: Record<string, { bg: string; text: string }> = {
  coding: { bg: '#eff6ff', text: '#1d4ed8' },
  mcq: { bg: '#f5f3ff', text: '#7c3aed' },
  file_upload: { bg: '#ecfdf5', text: '#059669' },
  design: { bg: '#fffbeb', text: '#d97706' },
};

const typeLabels: Record<string, string> = {
  coding: 'Code Challenge',
  mcq: 'MCQ & Debugging',
  file_upload: 'File Upload',
  design: 'Design',
};

interface Task {
  _id: string;
  moduleId: string;
}

interface Submission {
  _id: string;
  taskId: { _id: string } | string;
  status: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, taskRes, subRes] = await Promise.all([
          fetch(getApiUrl('/api/modules')),
          fetch(getApiUrl('/api/tasks')),
          fetch(getApiUrl('/api/submissions'))
        ]);
        
        const modData = await modRes.json();
        const taskData = await taskRes.json();
        const subData = await subRes.json();

        setModules(modData.modules || []);
        setTasks(taskData.tasks || []);
        setSubmissions((subData.submissions || []).filter((s: any) => 
          s.status === 'pass' || s.status === 'accepted' || s.status === 'needs_review'
        ));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filtered = modules.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || m.type === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPoints = (m: Module) =>
    m.stageConfig
      ? m.stageConfig.easy.count * m.stageConfig.easy.pointsPerTask +
        m.stageConfig.intermediate.count * m.stageConfig.intermediate.pointsPerTask +
        m.stageConfig.expert.count * m.stageConfig.expert.pointsPerTask
      : 0;

  return (
    <AppShell title="Modules" subtitle="All available skill evaluation modules">
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors"
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
          {['all', 'coding', 'mcq', 'file_upload', 'design'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === type
                  ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted-fg)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
              }`}
            >
              {type === 'all' ? 'All Modules' : typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[240px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <p className="text-[var(--muted)] text-sm font-medium">No modules match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
          {filtered.map((module) => {
            const colors = typeColors[module.type] || { bg: '#f1f5f9', text: '#64748b' };
            const completedTaskIds = new Set(submissions.map(s => typeof s.taskId === 'object' ? s.taskId._id : s.taskId));
            const moduleTasks = tasks.filter(t => t.moduleId === module._id);
            const moduleCompleted = moduleTasks.filter(t => completedTaskIds.has(t._id)).length;
            const moduleAvailable = moduleTasks.length - moduleCompleted;

            return (
              <Link key={module._id} href={`/modules/${module._id}`} className="group block h-full">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 h-full flex flex-col gap-2 transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99]">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg group-hover:scale-105 transition-transform duration-300 origin-left">
                        {module.icon || '📚'}
                      </span>
                      <div className="text-[7px] font-black text-[var(--muted)] uppercase">
                        {moduleAvailable} Tasks Available
                      </div>
                    </div>
                    <span
                      className="px-1.5 py-0 rounded text-[7px] font-black uppercase tracking-tighter"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {typeLabels[module.type] || module.type}
                    </span>
                  </div>
// ... existing lines ...
                  <div className="flex-1">
                    <h3 className="text-[11px] font-black text-[var(--foreground)] mb-0.5 group-hover:text-[var(--primary)] transition-colors leading-tight">
                      {module.name}
                    </h3>
                    <p className="text-[9px] text-[var(--muted)] leading-tight line-clamp-2 font-bold opacity-80">
                      {module.description}
                    </p>
                  </div>

                  {module.stageConfig && (
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: 'E', count: module.stageConfig.easy.count, pts: module.stageConfig.easy.pointsPerTask },
                        { label: 'M', count: module.stageConfig.intermediate.count, pts: module.stageConfig.intermediate.pointsPerTask },
                        { label: 'X', count: module.stageConfig.expert.count, pts: module.stageConfig.expert.pointsPerTask },
                      ].map((stage) => (
                        <div
                          key={stage.label}
                          className="p-1 bg-[var(--surface-hover)] rounded-md text-center border border-transparent transition-colors group-hover:border-[var(--border)]"
                        >
                          <div className="text-[7px] text-[var(--muted)] mb-0 font-black uppercase">{stage.label}</div>
                          <div className="text-[10px] font-black text-[var(--foreground)] leading-none">{stage.count}</div>
                          <div className="text-[7px] text-[var(--muted)] font-black">{stage.pts}P</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-[var(--foreground)] leading-none">
                        {totalPoints(module).toLocaleString()} <span className="text-[7px] font-black text-[var(--muted)]">PTS</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-[var(--primary)] group-hover:gap-1.5 transition-all uppercase tracking-tighter">
                      {moduleAvailable === 0 ? 'REVIEW' : 'START'} <ArrowRight size={10} strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

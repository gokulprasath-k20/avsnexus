'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Search, Filter, ArrowRight, BookOpen } from 'lucide-react';

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

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((d) => setModules(d.modules || []))
      .finally(() => setLoading(false));
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
            return (
              <Link key={module._id} href={`/modules/${module._id}`} className="group block h-full">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 h-full flex flex-col gap-3 transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99]">
                  <div className="flex items-start justify-between">
                    <span className="text-xl group-hover:scale-105 transition-transform duration-300 origin-left">
                      {module.icon || '📚'}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wider"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {typeLabels[module.type] || module.type}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed line-clamp-2">
                      {module.description}
                    </p>
                  </div>

                  {module.stageConfig && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Easy', count: module.stageConfig.easy.count, pts: module.stageConfig.easy.pointsPerTask },
                        { label: 'Mid', count: module.stageConfig.intermediate.count, pts: module.stageConfig.intermediate.pointsPerTask },
                        { label: 'Expert', count: module.stageConfig.expert.count, pts: module.stageConfig.expert.pointsPerTask },
                      ].map((stage) => (
                        <div
                          key={stage.label}
                          className="p-1.5 bg-[var(--surface-hover)] rounded-lg text-center border border-transparent transition-colors group-hover:border-[var(--border)]"
                        >
                          <div className="text-[8px] text-[var(--muted)] mb-0.5 font-bold uppercase tracking-tight">{stage.label}</div>
                          <div className="text-xs font-black text-[var(--foreground)]">{stage.count}</div>
                          <div className="text-[8px] text-[var(--muted)] font-bold">{stage.pts}PTS</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-[var(--muted)] uppercase font-extrabold tracking-wider">Potential</span>
                      <span className="text-xs font-black text-[var(--foreground)]">
                        {totalPoints(module).toLocaleString()} <span className="text-[8px] font-bold text-[var(--muted)]">PTS</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--primary)] group-hover:gap-2 transition-all uppercase tracking-tight">
                      Start <ArrowRight size={12} strokeWidth={3} />
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

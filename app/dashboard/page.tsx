'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { BookOpen, Trophy, CheckCircle, Clock, TrendingUp, ArrowRight, Star } from 'lucide-react';

interface Module {
  _id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((d) => setModules(d.modules || []))
      .finally(() => setLoading(false));
  }, []);

  const stats: StatsCard[] = [
    {
      label: 'Total Points',
      value: (user?.totalPoints || 0).toLocaleString(),
      icon: <Star size={18} />,
      color: 'var(--warning)',
    },
    {
      label: 'Modules Available',
      value: modules.length,
      icon: <BookOpen size={18} />,
      color: 'var(--primary)',
    },
    {
      label: 'Completed Tasks',
      value: '—',
      icon: <CheckCircle size={18} />,
      color: 'var(--success)',
    },
    {
      label: 'Current Streak',
      value: '—',
      icon: <TrendingUp size={18} />,
      color: 'var(--danger)',
    },
  ];

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

  return (
    <AppShell
      title={`Good day, ${user?.name?.split(' ')[0]} 👋`}
      subtitle={`Student • ${user?.category === 'elite' ? 'Elite' : 'Non-Elite'} • ${user?.department || 'Unassigned'} Department • Year ${user?.year || '1'}`}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 sm:p-3 flex items-start justify-between transition-all hover:shadow-sm"
          >
            <div>
              <p className="text-[9px] sm:text-[10px] text-[var(--muted)] mb-0.5 uppercase tracking-wider font-bold">
                {stat.label}
              </p>
              <p className="text-base sm:text-lg font-extrabold text-[var(--foreground)] tracking-tight">
                {stat.value}
              </p>
            </div>
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: `${stat.color}15`,
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Modules section */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-[var(--foreground)] uppercase tracking-tight">
              Available Modules
            </h2>
          </div>
          <Link
            href="/modules"
            className="text-[10px] sm:text-[11px] font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight size={10} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-28 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8 sm:py-10 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <BookOpen size={20} className="text-[var(--muted)] mx-auto mb-1.5" />
            <p className="text-[var(--muted)] text-[11px] px-4">
              No modules available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {modules.slice(0, 6).map((module) => (
              <Link key={module._id} href={`/modules/${module._id}`} className="group block h-full">
                <div
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 sm:p-4 h-full transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-sm active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg sm:text-xl group-hover:scale-105 transition-transform duration-300 origin-left">
                      {module.icon || '📚'}
                    </div>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-tighter bg-[var(--surface-hover)] border border-[var(--border)]"
                      style={{
                        color: moduleTypeColors[module.type] || '#64748b',
                      }}
                    >
                      {moduleTypeLabels[module.type] || module.type}
                    </span>
                  </div>
                  <h3 className="text-[11px] sm:text-[12px] font-bold text-[var(--foreground)] mb-1 leading-tight">
                    {module.name}
                  </h3>
                  <p className="text-[10px] text-[var(--muted)] leading-tight mb-0 line-clamp-2 min-h-[1.2rem]">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

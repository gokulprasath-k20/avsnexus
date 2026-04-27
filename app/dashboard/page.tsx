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
      {/* Stats row - Ultra Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 mb-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 flex items-center justify-between transition-all hover:border-[var(--border-strong)]"
          >
            <div>
              <p className="text-[8px] text-[var(--muted)] mb-0 uppercase tracking-widest font-black">
                {stat.label}
              </p>
              <p className="text-sm font-black text-[var(--foreground)] tracking-tight leading-none mt-0.5">
                {stat.value}
              </p>
            </div>
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{
                background: `${stat.color}10`,
                color: stat.color,
              }}
            >
              {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 12 })}
            </div>
          </div>
        ))}
      </div>

      {/* Modules section - High Density */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2 className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">
              Available Modules
            </h2>
          </div>
          <Link
            href="/modules"
            className="text-[9px] font-black text-[var(--primary)] flex items-center gap-1 hover:underline uppercase"
          >
            All <ArrowRight size={10} strokeWidth={3} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[var(--surface)] border border-[var(--border)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <p className="text-[var(--muted)] text-[9px] font-black uppercase">No modules</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {modules.slice(0, 8).map((module) => (
              <Link key={module._id} href={`/modules/${module._id}`} className="group block">
                <div
                  className="bg-[var(--surface)] border border-[var(--border)] rounded p-2 h-full transition-all duration-300 hover:border-[var(--foreground)] active:scale-[0.98] flex items-center gap-2"
                >
                  <div className="text-base group-hover:scale-110 transition-transform flex-shrink-0">
                    {module.icon || '📚'}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-[10px] font-black text-[var(--foreground)] truncate uppercase">
                      {module.name}
                    </h3>
                    <p className="text-[8px] text-[var(--muted)] font-bold truncate">
                      {moduleTypeLabels[module.type] || module.type}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

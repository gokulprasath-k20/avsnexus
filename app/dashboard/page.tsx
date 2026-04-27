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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
                {stat.label}
              </p>
              <p
                style={{ fontSize: '24px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em' }}
              >
                {stat.value}
              </p>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `${stat.color}15`,
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Modules section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)' }}>
              Available Modules
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Select a module to start your evaluation
            </p>
          </div>
          <Link
            href="/modules"
            style={{
              fontSize: '13px',
              color: 'var(--primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '140px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  animation: 'pulse 2s infinite',
                }}
              />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              background: 'var(--surface)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <BookOpen size={32} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              No modules available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {modules.slice(0, 6).map((module) => (
              <Link key={module._id} href={`/modules/${module._id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{module.icon || '📚'}</div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    {module.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      lineHeight: '1.5',
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {module.description}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: `${moduleTypeColors[module.type] || '#64748b'}15`,
                      color: moduleTypeColors[module.type] || '#64748b',
                    }}
                  >
                    {moduleTypeLabels[module.type] || module.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

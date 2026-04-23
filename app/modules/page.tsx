'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';

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
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '13.5px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'coding', 'mcq', 'file_upload', 'design'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: filter === type ? 'var(--foreground)' : 'var(--surface)',
                color: filter === type ? 'var(--background)' : 'var(--muted-fg)',
                fontSize: '12.5px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {type === 'all' ? 'All' : typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '200px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
          <p>No modules match your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filtered.map((module) => {
            const colors = typeColors[module.type] || { bg: '#f1f5f9', text: '#64748b' };
            return (
              <Link key={module._id} href={`/modules/${module._id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '22px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
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
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '32px' }}>{module.icon || '📚'}</span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {typeLabels[module.type] || module.type}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '6px' }}>
                      {module.name}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {module.description}
                    </p>
                  </div>

                  {module.stageConfig && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { label: 'Easy', count: module.stageConfig.easy.count, pts: module.stageConfig.easy.pointsPerTask },
                        { label: 'Mid', count: module.stageConfig.intermediate.count, pts: module.stageConfig.intermediate.pointsPerTask },
                        { label: 'Expert', count: module.stageConfig.expert.count, pts: module.stageConfig.expert.pointsPerTask },
                      ].map((stage) => (
                        <div
                          key={stage.label}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: 'var(--surface-hover)',
                            borderRadius: '6px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>{stage.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{stage.count}</div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{stage.pts}pts ea.</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Max: <strong style={{ color: 'var(--foreground)' }}>{totalPoints(module).toLocaleString()}</strong> pts
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '500' }}>Start →</span>
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

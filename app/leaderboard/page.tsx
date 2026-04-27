'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  student: { _id: string; name: string; email: string; avatar?: string };
  totalPoints: number;
  easyPoints?: number;
  intermediatePoints?: number;
  expertPoints?: number;
  completedTasks?: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/leaderboard'))
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} style={{ color: '#f59e0b' }} />;
    if (rank === 2) return <Medal size={18} style={{ color: '#94a3b8' }} />;
    if (rank === 3) return <Award size={18} style={{ color: '#cd7f32' }} />;
    return <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600', width: '18px', textAlign: 'center' }}>{rank}</span>;
  };

  return (
    <AppShell title="Leaderboard" subtitle="Global rankings across all modules">
      <div style={{ maxWidth: '800px' }}>
        {/* Top 3 podium - Compact */}
        {leaderboard.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', marginBottom: '16px', padding: '8px 0' }}>
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumIdx) => {
              const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights = [40, 60, 30];
              const colors = ['#94a3b8', '#f59e0b', '#cd7f32'];
              const initials = entry.student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={entry.student._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900' }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--foreground)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{entry.student.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: colors[podiumIdx] }}>{entry.totalPoints}</div>
                  </div>
                  <div style={{ width: '50px', height: `${heights[podiumIdx]}px`, background: colors[podiumIdx], borderRadius: '3px 3px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: 'white' }}>#{actualRank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table - High Density */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '30px 1fr 60px', gap: '8px', alignItems: 'center', background: 'var(--surface-hover)' }}>
            {['#', 'Student', 'Pts'].map((h) => (
              <span key={h} style={{ fontSize: '8px', fontVariationSettings: '"wght" 900', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: h === 'Pts' ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '14px', height: '14px', margin: '0 auto' }} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '10px', fontWeight: '700' }}>EMPTY</div>
          ) : (
            leaderboard.map((entry) => {
              const initials = entry.student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div
                  key={entry.student._id}
                  style={{
                    padding: '5px 10px',
                    borderBottom: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 60px',
                    gap: '8px',
                    alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-start', fontSize: '10px', fontWeight: '900', color: entry.rank <= 3 ? 'var(--warning)' : 'var(--muted)' }}>
                    {entry.rank}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      background: 'var(--foreground)', color: 'var(--background)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', fontWeight: '900', flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.1', textTransform: 'uppercase' }}>{entry.student.name}</div>
                      <div style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entry.student.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--foreground)' }}>
                      {entry.totalPoints.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

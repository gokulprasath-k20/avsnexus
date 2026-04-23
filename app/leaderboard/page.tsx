'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
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
    fetch('/api/leaderboard')
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
        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', marginBottom: '32px', padding: '24px 0' }}>
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumIdx) => {
              const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights = [90, 120, 70];
              const colors = ['#94a3b8', '#f59e0b', '#cd7f32'];
              const initials = entry.student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={entry.student._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--foreground)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{entry.student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{entry.totalPoints.toLocaleString()} pts</div>
                  </div>
                  <div style={{ width: '80px', height: `${heights[podiumIdx]}px`, background: colors[podiumIdx], borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>#{actualRank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '40px 1fr 120px', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rank</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Points</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              No rankings yet. Start completing tasks!
            </div>
          ) : (
            leaderboard.map((entry) => {
              const initials = entry.student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div
                  key={entry.student._id}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px',
                    gap: '12px',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }}>{getRankIcon(entry.rank)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--foreground)', color: 'var(--background)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '600', flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--foreground)' }}>{entry.student.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{entry.student.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>
                      {entry.totalPoints.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>points</div>
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

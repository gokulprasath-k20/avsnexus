'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Lock } from 'lucide-react';

interface DeadlineCountdownProps {
  deadlineTime: string | Date | null | undefined;
  status: 'available' | 'completed' | 'failed';
  compact?: boolean;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DeadlineCountdown({
  deadlineTime,
  status,
  compact = false,
}: DeadlineCountdownProps) {
  const [msLeft, setMsLeft] = useState<number>(0);

  useEffect(() => {
    if (!deadlineTime || status !== 'available') return;

    const target = new Date(deadlineTime).getTime();
    const tick = () => setMsLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineTime, status]);

  // No deadline
  if (!deadlineTime || status === 'completed') return null;

  // Failed / expired
  if (status === 'failed' || msLeft <= 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: compact ? '9px' : '11px',
          fontWeight: '800',
          color: 'var(--danger)',
          background: 'rgba(239,68,68,0.1)',
          padding: compact ? '2px 6px' : '3px 8px',
          borderRadius: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Lock size={compact ? 9 : 11} strokeWidth={2.5} />
        Locked
      </span>
    );
  }

  const isUrgent = msLeft < 30 * 60 * 1000; // < 30 mins
  const isCritical = msLeft < 5 * 60 * 1000; // < 5 mins

  const color = isCritical
    ? 'var(--danger)'
    : isUrgent
    ? '#f59e0b'
    : 'var(--primary)';

  const bg = isCritical
    ? 'rgba(239,68,68,0.1)'
    : isUrgent
    ? 'rgba(245,158,11,0.1)'
    : 'rgba(var(--primary-rgb),0.1)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: compact ? '9px' : '11px',
        fontWeight: '800',
        color,
        background: bg,
        padding: compact ? '2px 6px' : '3px 8px',
        borderRadius: '6px',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
        animation: isCritical ? 'pulse 1s infinite' : undefined,
      }}
    >
      {isUrgent ? (
        <AlertTriangle size={compact ? 9 : 11} strokeWidth={2.5} />
      ) : (
        <Clock size={compact ? 9 : 11} strokeWidth={2} />
      )}
      {formatTimeLeft(msLeft)}
    </span>
  );
}

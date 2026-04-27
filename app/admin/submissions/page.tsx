'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { ExternalLink, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Submission {
  _id: string;
  studentId: { name: string; email: string };
  taskId: { title: string; type: string; stage: string; points: number; submissionGuidelines?: string };
  status: string;
  score: number;
  fileUrl?: string;
  fileName?: string;
  feedback?: string;
  submittedAt: string;
}

import { useAuth } from '@/contexts/AuthContext';

export default function AdminSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then((d) => {
        const all = d.submissions || [];
        // Filter based on admin's assigned module type
        if (user?.role === 'moduleAdmin' && user.assignedModuleType) {
          setSubmissions(all.filter((s: any) => s.taskId?.type === user.assignedModuleType));
        } else {
          setSubmissions(all);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const adminTitle = user?.assignedModuleType === 'coding' ? 'CodeAdmin' : 
                     user?.assignedModuleType === 'mcq' ? 'DebugAdmin' : 
                     user?.assignedModuleType === 'file_upload' ? 'PresentAdmin' : 'Admin';

  const submitReview = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) throw new Error('Review failed');
      toast.success('Evaluation updated!');
      setReviewing(null);
      
      setSubmissions((prev) => prev.map((s) => {
        if (s._id === submissionId) {
          return { ...s, score: reviewForm.score, feedback: reviewForm.feedback, status: 'reviewed' };
        }
        return s;
      }));
    } catch {
      toast.error('Failed to submit evaluation');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted' || status === 'reviewed') return 'var(--success)';
    if (status === 'needs_review' || status === 'pending') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <AppShell title={`${adminTitle} Submissions`} subtitle={`Review and evaluate ${user?.assignedModuleType || 'assigned'} tasks`}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '20px', height: '20px' }} />
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <Check size={24} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '2px' }}>Clear!</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)' }}>No {user?.assignedModuleType} submissions found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {submissions.map((sub) => (
            <div
              key={sub._id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="truncate">{sub.taskId?.title}</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: '3px', color: 'var(--muted-fg)', textTransform: 'uppercase', border: '1px solid var(--border)' }}>
                      {sub.taskId?.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{sub.studentId?.name}</span> •{' '}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--foreground)' }}>
                      {sub.score} <span style={{ color: 'var(--muted)', fontWeight: '500' }}>/ {sub.taskId?.points || 0}</span>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: getStatusColor(sub.status), textTransform: 'uppercase' }}>
                      {sub.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all"
                        title="View File"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    
                    <button
                      onClick={() => { setReviewing(sub._id); setReviewForm({ score: sub.score || 0, feedback: sub.feedback || '' }); }}
                      className="px-3 h-7 text-[11px] font-bold rounded-md border border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all"
                    >
                      Evaluate
                    </button>
                  </div>
                </div>
              </div>

              {sub.feedback && reviewing !== sub._id && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--background)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '10px', color: 'var(--muted-fg)' }}>
                  <span style={{ fontWeight: '700', color: 'var(--foreground)' }}>Feedback:</span> {sub.feedback}
                </div>
              )}

              {reviewing === sub._id && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Score</label>
                      <input
                        type="number"
                        min={0}
                        max={sub.taskId?.points || 100}
                        value={reviewForm.score}
                        onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                        style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Feedback</label>
                      <input
                        value={reviewForm.feedback}
                        onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                        placeholder="Evaluation notes..."
                        style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => submitReview(sub._id)}
                      className="flex-1 h-7 text-[11px] font-bold rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-all"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setReviewing(null)}
                      className="px-3 h-7 text-[11px] font-bold rounded-md border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

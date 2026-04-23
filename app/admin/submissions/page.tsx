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

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .finally(() => setLoading(false));
  }, []);

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
      
      // Update local state instead of removing it
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
    <AppShell title="Student Submissions" subtitle="Evaluate, add feedback, and override marks">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <Check size={32} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>No submissions yet.</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Students haven't submitted any tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map((sub) => (
            <div
              key={sub._id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 22px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sub.taskId?.title}
                    <span style={{ fontSize: '10px', fontWeight: '500', background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--muted-fg)', textTransform: 'uppercase' }}>
                      {sub.taskId?.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {sub.studentId?.name} ({sub.studentId?.email}) •{' '}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: getStatusColor(sub.status) }}>
                    Score: {sub.score} / {sub.taskId?.points || 0}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: getStatusColor(sub.status), background: `${getStatusColor(sub.status)}12`, padding: '3px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {sub.status.replace('_', ' ')}
                  </span>
                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-hover)' }}
                    >
                      <ExternalLink size={12} /> View File
                    </a>
                  )}
                </div>
              </div>

              {sub.feedback && (
                <div style={{ background: 'var(--background)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '12px', color: 'var(--foreground)' }}>
                  <strong>Admin Feedback:</strong> {sub.feedback}
                </div>
              )}

              {reviewing === sub._id ? (
                <div style={{ background: 'var(--surface-hover)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '5px' }}>
                        Override Score
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={sub.taskId?.points || 100}
                        value={reviewForm.score}
                        onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })}
                        style={{ width: '100px', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '5px' }}>
                        Feedback
                      </label>
                      <textarea
                        value={reviewForm.feedback}
                        onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                        placeholder="Explain why the score was changed or give tips..."
                        rows={2}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => submitReview(sub._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      <Check size={13} /> Save Evaluation
                    </button>
                    <button
                      onClick={() => setReviewing(null)}
                      style={{ padding: '7px 12px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--muted-fg)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setReviewing(sub._id); setReviewForm({ score: sub.score || 0, feedback: sub.feedback || '' }); }}
                  style={{ padding: '7px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: 'var(--foreground)' }}
                >
                  Edit Evaluation
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

'use client';

import React, { useState } from 'react';
import { Bell, Send, Users, Filter, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

interface NotificationFormProps {
  role: 'superadmin' | 'moduleAdmin';
}

export default function NotificationForm({ role }: NotificationFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'filters'>('all');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    section: '',
  });
  const [loading, setLoading] = useState(false);

  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'];
  const years = ['1', '2', '3', '4'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/notifications/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          message,
          target: role === 'superadmin' ? target : 'filters',
          filters: target === 'filters' || role === 'moduleAdmin' ? filters : null,
          url: '/student-dashboard',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Sent to ${data.recipientCount || 0} recipients`);
        setTitle('');
        setMessage('');
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-fade)] text-[var(--primary)] flex items-center justify-center">
          <Bell size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight">Send Notification</h2>
          <p className="text-xs text-[var(--muted)]">Broadcast messages to students instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
            Notification Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Task Released"
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
            Message Content
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={4}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none"
            required
          />
        </div>

        {role === 'superadmin' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all ${
                  target === 'all'
                    ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-md'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
                }`}
              >
                <Users size={14} />
                All Students
              </button>
              <button
                type="button"
                onClick={() => setTarget('filters')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all ${
                  target === 'filters'
                    ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-md'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
                }`}
              >
                <Filter size={14} />
                Targeted
              </button>
            </div>
          </div>
        )}

        {(target === 'filters' || role === 'moduleAdmin') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y} Year</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                Section
              </label>
              <input
                type="text"
                value={filters.section}
                onChange={(e) => setFilters({ ...filters, section: e.target.value.toUpperCase() })}
                placeholder="All (e.g. A)"
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary)] text-white rounded-2xl py-4 font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Send size={18} strokeWidth={2.5} />
              Send Broadcast
            </>
          )}
        </button>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Code2, 
  CheckSquare, 
  Save, 
  ChevronRight,
  AlertCircle,
  FileCode,
  User as UserIcon,
  Terminal
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
  registerNumber?: string;
  department?: string;
}

interface Submission {
  _id: string;
  studentId: Student;
  taskId: {
    _id: string;
    title: string;
    type: string;
    points: number;
    description: string;
  };
  code?: string;
  language?: string;
  output?: string;
  error?: string;
  mcqAnswers: Array<{
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  status: string;
  marks: number;
  remarks: string;
  startedAt?: string;
  submittedAt: string;
  isAutoSubmitted: boolean;
  totalQuestions: number;
  attendedQuestions: number;
  reason?: string;
  compileError?: string;
  statusDesc?: string;
}

export default function EvaluationPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  // Evaluation form state
  const [marks, setMarks] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('pass');

  useEffect(() => {
    if (!moduleId) return;
    
    const fetchSubmissions = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const targetStudentId = searchParams.get('studentId');

        const res = await fetch(getApiUrl(`/api/submissions?moduleId=${moduleId}`));
        const data = await res.json();
        if (data.submissions) {
          setSubmissions(data.submissions);
          
          if (data.submissions.length > 0) {
            let initialSub = data.submissions[0];
            if (targetStudentId) {
              const found = data.submissions.find((s: any) => s.studentId?._id === targetStudentId || s.studentId === targetStudentId);
              if (found) initialSub = found;
            }
            handleSelectSubmission(initialSub);
          }
        }
      } catch (err) {
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [moduleId]);

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedSubmission(sub);
    setMarks(sub.marks || 0);
    setRemarks(sub.remarks || '');
    setStatus(sub.status === 'fail' ? 'fail' : 'pass');
  };

  const submitEvaluation = async () => {
    if (!selectedSubmission) return;
    setEvaluating(true);
    try {
      const res = await fetch(getApiUrl(`/api/submissions/${selectedSubmission._id}/evaluate`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks, remarks, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save evaluation');
      
      toast.success('Evaluation saved successfully');
      
      // Update local state
      setSubmissions(prev => prev.map(s => s._id === selectedSubmission._id ? { ...s, marks, remarks, status } : s));
      setSelectedSubmission(prev => prev ? { ...prev, marks, remarks, status } : null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Evaluation">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="spinner" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Module Evaluation" subtitle="Review and grade student submissions">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        
        {/* Left Sidebar: Student List */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
                <Users size={12} />
                Student Submissions ({submissions.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none custom-scrollbar">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-[11px] font-bold text-[var(--muted)]">
                  No submissions found for this module.
                </div>
              ) : (
                submissions.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full p-4 border-b border-[var(--border)] flex items-start gap-3 text-left transition-all hover:bg-[var(--surface-hover)] ${selectedSubmission?._id === sub._id ? 'bg-[var(--surface-hover)] border-l-4 border-l-[var(--primary)]' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                      <UserIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-[var(--foreground)] truncate uppercase">
                        {sub.studentId.name}
                      </p>
                      <p className="text-[9px] font-bold text-[var(--muted)] truncate">
                        {sub.taskId.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {sub.status === 'pass' || sub.status === 'accepted' ? (
                          <span className="text-[8px] font-black uppercase bg-[var(--success)]/10 text-[var(--success)] px-1.5 py-0.5 rounded">PASSED</span>
                        ) : sub.status === 'fail' ? (
                          <span className="text-[8px] font-black uppercase bg-[var(--danger)]/10 text-[var(--danger)] px-1.5 py-0.5 rounded">FAILED</span>
                        ) : (
                          <span className="text-[8px] font-black uppercase bg-[var(--warning)]/10 text-[var(--warning)] px-1.5 py-0.5 rounded">PENDING</span>
                        )}
                        <span className="text-[8px] font-bold text-[var(--muted)] flex items-center gap-1">
                          <Clock size={8} /> {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Submission Review */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {selectedSubmission ? (
            <>
              <div className="glass-panel rounded-2xl flex flex-col overflow-hidden flex-1">
                {/* Review Header */}
                <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <h2 className="text-sm font-black text-[var(--foreground)] uppercase">
                        {selectedSubmission.studentId.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tighter">
                          REG: {selectedSubmission.studentId.registerNumber || 'N/A'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tighter">
                          {selectedSubmission.studentId.department || 'GENERAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase text-[var(--muted)]">Submission Date</div>
                      <div className="text-[11px] font-black text-[var(--foreground)]">
                        {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    {selectedSubmission.isAutoSubmitted && (
                      <div className="px-3 py-1 bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] rounded-lg flex items-center gap-1.5">
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase">Auto-Submitted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                  
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl">
                      <div className="text-[9px] font-black uppercase text-[var(--muted)] mb-1">Task Type</div>
                      <div className="text-xs font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                        {selectedSubmission.taskId.type === 'coding' ? <Code2 size={14} /> : <CheckSquare size={14} />}
                        {selectedSubmission.taskId.type}
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl">
                      <div className="text-[9px] font-black uppercase text-[var(--muted)] mb-1">Questions Attended</div>
                      <div className="text-xs font-black text-[var(--foreground)]">
                        {selectedSubmission.attendedQuestions} / {selectedSubmission.totalQuestions || '-'}
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl">
                      <div className="text-[9px] font-black uppercase text-[var(--muted)] mb-1">Time Started</div>
                      <div className="text-xs font-black text-[var(--foreground)]">
                        {selectedSubmission.startedAt ? new Date(selectedSubmission.startedAt).toLocaleTimeString() : 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl">
                      <div className="text-[9px] font-black uppercase text-[var(--muted)] mb-1">Max Points</div>
                      <div className="text-xs font-black text-[var(--primary)] uppercase">
                        {selectedSubmission.taskId.points} PTS
                      </div>
                    </div>
                  </div>

                  {/* Task Review: Coding */}
                  {selectedSubmission.taskId.type === 'coding' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode size={16} className="text-[var(--primary)]" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]">Coding Submission Review</h3>
                      </div>
                      
                      {(!selectedSubmission.code || selectedSubmission.code.trim() === '') ? (
                        <div className="p-8 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 flex flex-col items-center text-center gap-4">
                          <AlertCircle size={40} className="text-[var(--danger)]" />
                          <div>
                            <h4 className="text-sm font-black text-[var(--danger)] uppercase">Code Not Submitted</h4>
                            <p className="text-[11px] font-bold text-[var(--muted)] mt-1 uppercase">
                              {selectedSubmission.reason || 'Student finished the task without writing any code.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[#1e1e1e]">
                          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                Language: <span className="text-white">{selectedSubmission.language}</span>
                              </span>
                            </div>
                          </div>
                          <pre className="p-6 text-[13px] font-mono text-white/90 overflow-x-auto selection:bg-white/20 leading-relaxed custom-scrollbar max-h-[400px]">
                            <code>{selectedSubmission.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Execution Details Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase text-[var(--muted)] flex items-center gap-2">
                            <Terminal size={12} /> Console Output (Stdout)
                          </div>
                          <div className="p-5 bg-black border border-white/10 rounded-2xl font-mono text-[12px] text-white/80 min-h-[120px] max-h-[300px] overflow-auto custom-scrollbar leading-relaxed">
                            {(!selectedSubmission.code || selectedSubmission.code.trim() === '') ? 'N/A' : (selectedSubmission.output || <span className="opacity-30 italic">No standard output recorded.</span>)}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase text-[var(--danger)] flex items-center gap-2">
                            <AlertCircle size={12} /> Errors & Diagnostics
                          </div>
                          <div className="p-5 bg-[var(--danger)]/5 border border-[var(--danger)]/10 rounded-2xl font-mono text-[12px] text-[var(--danger)] min-h-[120px] max-h-[300px] overflow-auto custom-scrollbar leading-relaxed">
                            {(!selectedSubmission.code || selectedSubmission.code.trim() === '') ? 'N/A' : (
                              <>
                                {selectedSubmission.compileError ? (
                                  <div className="mb-4">
                                    <div className="text-[9px] font-black uppercase mb-1 opacity-60">Compiler:</div>
                                    <pre className="whitespace-pre-wrap">{selectedSubmission.compileError}</pre>
                                  </div>
                                ) : null}
                                {selectedSubmission.error ? (
                                  <div>
                                    <div className="text-[9px] font-black uppercase mb-1 opacity-60">Runtime:</div>
                                    <pre className="whitespace-pre-wrap">{selectedSubmission.error}</pre>
                                  </div>
                                ) : null}
                                {!selectedSubmission.compileError && !selectedSubmission.error && (
                                  <span className="opacity-30 italic">No errors reported.</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Test Cases Table */}
                      {selectedSubmission.testResults && selectedSubmission.testResults.length > 0 && (
                        <div className="space-y-4">
                          <div className="text-[10px] font-black uppercase text-[var(--muted)] flex items-center gap-2">
                            <CheckCircle2 size={12} /> Automated Test Case Results
                          </div>
                          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)]">
                                  <th className="p-4 text-[10px] font-black uppercase text-[var(--muted)]">#</th>
                                  <th className="p-4 text-[10px] font-black uppercase text-[var(--muted)]">Status</th>
                                  <th className="p-4 text-[10px] font-black uppercase text-[var(--muted)]">Result Output</th>
                                  <th className="p-4 text-[10px] font-black uppercase text-[var(--muted)]">Expected</th>
                                  <th className="p-4 text-[10px] font-black uppercase text-[var(--muted)]">Resources</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedSubmission.testResults.map((tr, idx) => (
                                  <tr key={idx} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                                    <td className="p-4 text-[11px] font-bold text-[var(--muted)]">{tr.testCase}</td>
                                    <td className="p-4">
                                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                        tr.status === 'Accepted' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'
                                      }`}>
                                        {tr.status}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <pre className="text-[10px] font-mono text-[var(--foreground)] truncate max-w-[200px]">{tr.output || 'N/A'}</pre>
                                    </td>
                                    <td className="p-4">
                                      <pre className="text-[10px] font-mono text-[var(--muted)] truncate max-w-[200px]">{tr.expected || (tr.isHidden ? '[Hidden]' : 'N/A')}</pre>
                                    </td>
                                    <td className="p-4 text-[9px] font-bold text-[var(--muted)] uppercase">
                                      {tr.time}s | {Math.round(tr.memory / 1024)}KB
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Review: MCQ */}
                  {(selectedSubmission.taskId.type === 'mcq' || selectedSubmission.mcqAnswers?.length > 0) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare size={16} className="text-[var(--primary)]" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]">MCQ Assessment Review</h3>
                      </div>

                      <div className="space-y-3">
                        {selectedSubmission.mcqAnswers?.map((ans, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border transition-all ${ans.isCorrect ? 'bg-[var(--success)]/5 border-[var(--success)]/20' : 'bg-[var(--danger)]/5 border-[var(--danger)]/20'}`}>
                            <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${ans.isCorrect ? 'bg-[var(--success)] text-white' : 'bg-[var(--danger)] text-white'}`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-[13px] font-bold text-[var(--foreground)] mb-3">{ans.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase text-[var(--muted)]">Student Answer</span>
                                    <div className={`text-[11px] font-black uppercase flex items-center gap-2 ${ans.isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                      {ans.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                      {ans.selectedAnswer || 'Not Answered'}
                                    </div>
                                  </div>
                                  {!ans.isCorrect && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[8px] font-black uppercase text-[var(--muted)]">Correct Answer</span>
                                      <div className="text-[11px] font-black uppercase text-[var(--success)] flex items-center gap-2">
                                        <CheckCircle2 size={12} />
                                        {ans.correctAnswer}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Evaluation Controls Footer */}
                <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-hover)]">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black uppercase text-[var(--muted)] mb-2">Assign Marks</label>
                      <input 
                        type="number" 
                        value={marks}
                        onChange={(e) => setMarks(Number(e.target.value))}
                        max={selectedSubmission.taskId.points}
                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-black text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-all"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[9px] font-black uppercase text-[var(--muted)] mb-2">Verdict</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setStatus('pass')}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${status === 'pass' ? 'bg-[var(--success)] text-white' : 'bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                        >
                          <CheckCircle2 size={14} /> Pass
                        </button>
                        <button 
                          onClick={() => setStatus('fail')}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${status === 'fail' ? 'bg-[var(--danger)] text-white' : 'bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                        >
                          <XCircle size={14} /> Fail
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[9px] font-black uppercase text-[var(--muted)] mb-2">Remarks / Feedback</label>
                      <input 
                        type="text" 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add some feedback for the student..."
                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted)]/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        onClick={submitEvaluation}
                        disabled={evaluating}
                        className="w-full bg-[var(--primary)] text-white rounded-xl py-2.5 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {evaluating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                        Save Result
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-3xl bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted)] mb-6">
                <Users size={40} />
              </div>
              <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight mb-2">No Student Selected</h2>
              <p className="text-[12px] font-bold text-[var(--muted)] max-w-xs mx-auto uppercase">
                Select a student from the left sidebar to begin evaluating their submission.
              </p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}

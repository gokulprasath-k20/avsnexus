'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import dynamic from 'next/dynamic';
import { ArrowLeft, Play, Check, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  stage: string;
  points: number;
  starterCode?: Record<string, string>;
  options?: { text: string; isCorrect: boolean }[];
  timeLimitMCQ?: number;
  submissionGuidelines?: string;
  allowedFormats?: string[];
  maxFileSizeMB?: number;
}

const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
];

export default function TaskClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Coding state
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');

  // MCQ state
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [mcqTimer, setMcqTimer] = useState<number | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);

  // Result
  const [result, setResult] = useState<{
    status: string;
    score: number;
    testResults?: Array<{ testCase: number; status: string; output?: string; expected?: string; isHidden?: boolean }>;
    feedback?: string;
  } | null>(null);

  const [runResult, setRunResult] = useState<{
    stdout: string;
    stderr: string;
    compile_output: string;
    status: string;
    time: string;
    memory: number;
  } | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-cheating state
  const [violationCount, setViolationCount] = useState(0);
  const [testFailed, setTestFailed] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, subRes] = await Promise.all([
          fetch(getApiUrl(`/api/tasks/${id}`)),
          fetch(getApiUrl(`/api/submissions?taskId=${id}`))
        ]);

        const taskData = await taskRes.json();
        const subData = await subRes.json();

        if (taskRes.ok) {
          const t = taskData.task;
          setTask(t);

          // Check if already completed
          const isDone = (subData.submissions || []).some((s: any) => 
            s.status === 'pass' || s.status === 'accepted' || s.status === 'needs_review'
          );

          if (isDone) {
            toast.error('Task already completed. Redirecting...');
            router.replace('/student-dashboard');
            return;
          }

          // Redirect coding tasks to the specialized playground
          if (t.type === 'coding') {
            router.replace(`/playground/${id}`);
            return;
          }
          
          // Always record start time for timed tests
          fetch(getApiUrl('/api/submissions/start'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: id }),
          })
          .then(r => r.json())
          .then(data => {
            if (data.startedAt) {
              setStartedAt(data.startedAt);
              setTimeLeft(data.duration);
            }
          });
        }
      } catch (err) {
        toast.error('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Timer logic
  useEffect(() => {
    if (loading || !startedAt || submitting || result || testFailed) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, startedAt, submitting, result, testFailed]);

  const handleAutoSubmit = () => {
    if (task?.type === 'mcq') {
      submitMCQ(true);
    } else if (task?.type === 'coding') {
      submitCoding(true);
    }
  };

  // Anti-cheating logic
  useEffect(() => {
    if (loading || !task || testFailed || result) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('Tab switched or browser minimized');
      }
    };

    const handleBlur = () => {
      handleViolation('Window lost focus');
    };

    const handleViolation = (reason: string) => {
      setViolationCount((prev) => {
        const next = prev + 1;
        if (next === 1) {
          toast.error('WARNING: Do not leave this tab. One more violation and your test will fail!', { duration: 5000 });
          setWarningMessage('Warning: Do not switch tabs!');
        } else if (next >= 2) {
          setTestFailed(true);
          failTest('Automatic fail due to multiple tab switches');
        }
        return next;
      });
    };

    const preventDefault = (e: any) => {
      e.preventDefault();
      toast.error('This action is restricted during the test!');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('contextmenu', preventDefault);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, [loading, task, testFailed, result]);

  const failTest = async (reason: string) => {
    setSubmitting(true);
    try {
      await fetch(getApiUrl('/api/submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: id, 
          status: 'fail', 
          violationCount: violationCount + 1,
          feedback: `Test failed: ${reason}` 
        }),
      });
      toast.error('TEST FAILED: You switched tabs multiple times.');
    } catch (err) {
      console.error('Failed to report violation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (task?.starterCode?.[lang]) {
      setCode(task.starterCode[lang]);
    } else {
      setCode('');
    }
  };

  const runCode = async () => {
    if (!code.trim()) return toast.error('Please write some code before running');
    setSubmitting(true);
    setResult(null); // clear previous submit result
    try {
      const res = await fetch(getApiUrl('/api/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRunResult(data);
      toast.success('Execution finished');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCoding = async (isAuto = false) => {
    if (!isAuto && !code.trim()) return toast.error('Please write some code before submitting');
    setSubmitting(true);
    setRunResult(null); // clear previous run result
    try {
      const res = await fetch(getApiUrl('/api/submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: id, 
          code, 
          language,
          startedAt,
          isAutoSubmitted: isAuto,
          status: isAuto ? 'fail' : 'needs_review'
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        status: data.submission.status,
        score: data.submission.score,
        testResults: data.submission.testResults,
      });
      if (isAuto) toast.error('Time up! Progress saved.');
      else if (data.submission.status === 'accepted' || data.submission.status === 'needs_review') toast.success(`Solution submitted! +${data.submission.score} points`);
      else toast.error('Incorrect Answer. Try again next time.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitMCQ = async (isAuto = false) => {
    if (!isAuto && selectedOptions.length === 0) return toast.error('Please select an answer');
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/api/submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: id, 
          selectedAnswers: selectedOptions,
          startedAt,
          isAutoSubmitted: isAuto
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ status: data.submission.status, score: data.submission.score });
      if (isAuto) toast.error('Time up! Your answers were automatically submitted.');
      else if (data.submission.score > 0) toast.success(`Correct Answer! +${data.submission.score} points`);
      else toast.error('Wrong Answer. Try again next time.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFile = async () => {
    if (!file) return toast.error('Please select a file');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', id);
      const res = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ status: 'needs_review', score: 0 });
      toast.success('File uploaded successfully! Awaiting admin review.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !task) {
    return (
      <AppShell title="Task">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      </AppShell>
    );
  }

  const stageColor = task.stage === 'easy' ? 'var(--success)' : task.stage === 'intermediate' ? 'var(--warning)' : 'var(--danger)';

  return (
    <AppShell title={task.title} subtitle={`${task.stage} • ${task.points} points`}>
      <Link href={`/modules`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', textDecoration: 'none', marginBottom: '20px' }} onClick={(e) => {
        if (!testFailed && !result && !window.confirm('Are you sure you want to leave? Your progress will be lost.')) {
          e.preventDefault();
        }
      }}>
        <ArrowLeft size={14} /> Back
      </Link>

      {testFailed && (
        <div style={{
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <X size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)', marginBottom: '8px' }}>Test Failed</h2>
          <p style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: '500' }}>
            This test has been automatically marked as FAIL due to tab switching or window focus violations.
          </p>
        </div>
      )}

      {violationCount === 1 && !testFailed && (
        <div style={{
          background: 'rgba(234,179,8,0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ⚠️ Warning: You switched tabs. Next time, the test will be failed automatically!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: task.type === 'coding' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Problem description */}
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: stageColor, background: `${stageColor}12`, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                {task.stage}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>+{task.points} pts</span>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '12px' }}>{task.title}</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-fg)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{task.description}</p>
          </div>

          {/* MCQ options */}
          {task.type === 'mcq' && task.options && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Choose the correct answer</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: timeLeft < 60 ? 'var(--danger)' : 'var(--foreground)',
                  background: 'var(--surface-hover)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}>
                  ⏱ {Math.floor(timeLeft / 60)}:{ (timeLeft % 60).toString().padStart(2, '0') }
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.options.map((opt, idx) => {
                  const isSelected = selectedOptions.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (result || testFailed) return;
                        setSelectedOptions(isSelected ? selectedOptions.filter((i) => i !== idx) : [idx]);
                      }}
                      disabled={!!result || testFailed}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(37,99,235,0.06)' : 'var(--background)',
                        color: 'var(--foreground)',
                        fontSize: '14px',
                        cursor: result ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        flexShrink: 0,
                      }} />
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {!result && (
                <button
                  onClick={() => submitMCQ()}
                  disabled={submitting || selectedOptions.length === 0 || testFailed}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '10px',
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              )}

              {result && (
                <div style={{
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: '8px',
                  background: result.score > 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                  border: `1px solid ${result.score > 0 ? 'var(--success)' : 'var(--danger)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  {result.score > 0 ? <Check size={18} color="var(--success)" /> : <X size={18} color="var(--danger)" />}
                  <span style={{ fontSize: '14px', fontWeight: '500', color: result.score > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {result.score > 0 ? `Correct Answer! +${result.score} points earned` : 'Wrong Answer. Try again next time.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* File upload */}
          {task.type === 'file_upload' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '22px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Upload Your File</h3>
              {task.submissionGuidelines && (
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                  {task.submissionGuidelines}
                </p>
              )}
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {file ? file.name : 'Drag & drop or click to upload'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    PDF, PPT, PPTX up to {task.maxFileSizeMB || 10}MB
                  </p>
                </label>
              </div>
              {!result && (
                <button
                  onClick={submitFile}
                  disabled={submitting || !file || testFailed}
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    padding: '10px',
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: file ? 'pointer' : 'not-allowed',
                    opacity: file ? 1 : 0.5,
                  }}
                >
                  {submitting ? 'Uploading...' : 'Submit File'}
                </button>
              )}
              {result?.status === 'needs_review' && (
                <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(37,99,235,0.06)', border: '1px solid var(--primary)', borderRadius: '8px', fontSize: '13px', color: 'var(--primary)' }}>
                  ✓ Submitted! Your file is pending admin review.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code editor — only for coding tasks */}
        {task.type === 'coding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${language === lang.id ? 'var(--foreground)' : 'var(--border)'}`,
                      background: language === lang.id ? 'var(--foreground)' : 'var(--surface)',
                      color: language === lang.id ? 'var(--background)' : 'var(--muted-fg)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsFullscreen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                Maximize
              </button>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', flex: 1, minHeight: '400px' }}>
              <MonacoEditor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(v) => !testFailed && setCode(v || '')}
                theme="vs-dark"
                options={{
                  readOnly: testFailed,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                }}
              />
            </div>

            {/* Fullscreen Overlay */}
            {isFullscreen && (
               <div className="fixed inset-0 z-[100] bg-[var(--background)] flex flex-col" style={{ paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)', paddingBottom: 'var(--safe-bottom)' }}>
                  <div className="border-b border-[var(--border)] flex items-center justify-between px-4 bg-[var(--surface)]" style={{ height: 'calc(36px + var(--safe-top))', paddingTop: 'var(--safe-top)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">{task.title}</span>
                      <div className="w-px h-4 bg-[var(--border)]" />
                      <span className="text-[10px] font-bold text-[var(--foreground)] uppercase">{language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={runCode}
                        disabled={submitting}
                        className="px-3 py-1 bg-[var(--foreground)] text-[var(--background)] rounded text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
                      >
                        {submitting ? '...' : 'Run'}
                      </button>
                      <button 
                        onClick={() => setIsFullscreen(false)}
                        className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <MonacoEditor
                      height="100%"
                      language={language === 'cpp' ? 'cpp' : language}
                      value={code}
                      onChange={(v) => setCode(v || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 20 },
                      }}
                    />
                  </div>
               </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={runCode}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Play size={15} />
                {submitting ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={() => submitCoding()}
                disabled={submitting || testFailed}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={15} />
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            {/* Run Results */}
            {runResult && !result && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Execution Result
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--muted)', background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                    {runResult.status}
                  </span>
                </div>
                
                {runResult.compile_output && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600', marginBottom: '4px' }}>Compilation Error:</div>
                    <pre style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {runResult.compile_output}
                    </pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600', marginBottom: '4px' }}>Runtime Error:</div>
                    <pre style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {runResult.stderr}
                    </pre>
                  </div>
                )}
                {runResult.stdout && !runResult.stderr && !runResult.compile_output && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600', marginBottom: '4px' }}>Output:</div>
                    <pre style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '10px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {runResult.stdout}
                    </pre>
                  </div>
                )}
                {!runResult.stdout && !runResult.stderr && !runResult.compile_output && runResult.status === 'Accepted' && (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Code executed successfully with no output.</div>
                )}
              </div>
            )}

            {/* Submit Results */}
            {result && result.testResults && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  {result.status === 'accepted' ? <Check size={16} color="var(--success)" /> : <X size={16} color="var(--warning)" />}
                  <span style={{ fontSize: '14px', fontWeight: '600', color: result.status === 'accepted' ? 'var(--success)' : 'var(--warning)' }}>
                    {result.status === 'accepted' ? `Correct Answer! +${result.score} points` : `Incorrect Answer. Try again next time. (+${result.score} points for passed cases)`}
                  </span>
                </div>
                {result.testResults.map((tr, index) => (
                  <div key={tr.testCase || index} style={{
                    padding: '8px 12px',
                    marginBottom: '6px',
                    borderRadius: '6px',
                    background: tr.status === 'Accepted' ? 'rgba(22,163,74,0.06)' : 'rgba(234,179,8,0.06)',
                    border: `1px solid ${tr.status === 'Accepted' ? 'var(--success)' : 'var(--warning)'}20`,
                    fontSize: '12px',
                  }}>
                    <div style={{ fontWeight: '500', color: tr.status === 'Accepted' ? 'var(--success)' : 'var(--warning)' }}>
                      Test {tr.testCase || index + 1}: {tr.status === 'Accepted' ? 'Passed' : 'Failed'}
                    </div>
                    {tr.status !== 'Accepted' && tr.output && !tr.isHidden && (
                      <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                        Your Output: <code>{tr.output}</code>
                      </div>
                    )}
                    {tr.status !== 'Accepted' && tr.isHidden && (
                      <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                        Hidden test case failed.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

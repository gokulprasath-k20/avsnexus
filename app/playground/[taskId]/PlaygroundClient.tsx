'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play, 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  ArrowLeft, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  Maximize2,
  Minimize2,
  Code2,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// No need for Lucide namespace if we use destructured imports correctly
import * as Lucide from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  moduleId: string;
  allowedLanguages?: string[];
  starterCode?: Record<string, string>;
}

const LANGUAGES = [
  { value: 'c', label: 'C', ext: 'c' },
  { value: 'cpp', label: 'C++', ext: 'cpp' },
  { value: 'python', label: 'Python', ext: 'py' },
  { value: 'java', label: 'Java', ext: 'java' },
  { value: 'javascript', label: 'Node.js', ext: 'js' },
];

export default function PlaygroundClient() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'code' | 'input' | 'output'>('code');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const [execResult, setExecResult] = useState<{
    stdout: string;
    stderr: string;
    compileError: string;
    time: string;
    memory: number;
    status?: 'PASS' | 'FAIL' | 'ERROR';
  } | null>(null);

  const [testResults, setTestResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const startTask = async () => {
      try {
        const res = await fetch(getApiUrl('/api/submissions/start'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        });
        const data = await res.json();
        if (data.startedAt) {
          setStartedAt(data.startedAt);
          setTimeLeft(data.duration || 1800);
        }
      } catch (err) {
        console.error('Failed to record start time');
      }
    };

    const fetchTask = async () => {
      try {
        const [taskRes, subRes] = await Promise.all([
          fetch(getApiUrl(`/api/tasks/${taskId}`)),
          fetch(getApiUrl(`/api/submissions?taskId=${taskId}`))
        ]);

        const taskData = await taskRes.json();
        const subData = await subRes.json();

        if (!taskRes.ok) throw new Error(taskData.error || 'Failed to load task');
        
        const currentTask = taskData.task;
        if (currentTask.type !== 'coding') {
          toast.error('This is not a coding challenge');
          router.push('/student-dashboard');
          return;
        }

        // Check if already completed
        const isDone = (subData.submissions || []).some((s: any) => 
          s.status === 'pass' || s.status === 'accepted' || s.status === 'needs_review'
        );

        if (isDone) {
          toast.error('Task already completed. Redirecting...');
          router.push('/student-dashboard');
          return;
        }

        setTask(currentTask);
        
        // Handle language initialization
        const allowed = currentTask.allowedLanguages || [];
        if (allowed.length === 1) {
          setLanguage(allowed[0]);
          if (currentTask.starterCode?.[allowed[0]]) {
            setCode(currentTask.starterCode[allowed[0]]);
          }
        } else if (allowed.length > 0) {
          setLanguage(allowed[0]);
          if (currentTask.starterCode?.[allowed[0]]) {
            setCode(currentTask.starterCode[allowed[0]]);
          }
        } else {
          // Default to Python if none specified (fallback)
          setLanguage('python');
        }

        startTask();
      } catch (err: any) {
        toast.error(err.message);
        router.push('/student-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, router]);

  // Timer logic
  useEffect(() => {
    if (loading || !startedAt || isSubmitting || isTimeUp) return;

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
  }, [loading, startedAt, isSubmitting, isTimeUp]);

  const handleAutoSubmit = () => {
    setIsTimeUp(true);
    toast.error('Time is up! Auto-submitting your code...', { duration: 5000 });
    submitTask(true);
  };

  const runCode = async () => {
    if (isTimeUp) return;
    if (!language) {
      toast.error('Please select a language first');
      return;
    }
    
    setIsRunning(true);
    setExecResult(null);
    setActiveTab('output');
    setConsoleOpen(true);

    try {
      const res = await fetch(getApiUrl('/api/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input, taskId }),
      });
      const data = await res.json();
      
      if (data.error) {
        setExecResult({
          stdout: '',
          stderr: data.details || data.error,
          compileError: '',
          time: '0',
          memory: 0,
          status: 'ERROR'
        });
      } else {
        // More robust status detection
        const hasError = !!(data.stderr || data.compileError || (data.statusCode && data.statusCode >= 400));
        setExecResult({
          ...data,
          status: hasError ? 'FAIL' : 'PASS'
        });
      }
    } catch (err) {
      toast.error('Network error. Check your connection.');
    } finally {
      setIsRunning(false);
    }
  };

  const submitTask = async (isAuto = false) => {
    if (!isAuto && !code.trim()) {
      toast.error('Code is required to submit');
      return;
    }
    if (!isAuto && !language) {
      toast.error('Please select a language');
      return;
    }

    setIsSubmitting(true);
    setTestResults(null);
    setActiveTab('output');
    setConsoleOpen(true);

    try {
      const res = await fetch(getApiUrl('/api/submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          moduleId: task?.moduleId,
          code,
          language,
          input,
          output: execResult?.stdout || '',
          error: execResult?.stderr || '',
          compileError: execResult?.compileError || '',
          executionTime: execResult?.time || '0',
          memory: execResult?.memory || 0,
          status: isAuto ? 'fail' : 'pending',
          startedAt,
          isAutoSubmitted: !!isAuto
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      setTestResults(data.submission.testResults || []);
      
      const allPassed = data.submission.status === 'pass' || data.submission.status === 'accepted' || data.submission.status === 'needs_review';
      
      if (allPassed) {
        toast.success('Congratulations! All test cases passed.');
        setTimeout(() => router.push('/student-dashboard'), 3000);
      } else {
        toast.error('Some test cases failed. Keep trying!');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  
  const currentLang = LANGUAGES.find(l => l.value === language);
  const allowedLangs = LANGUAGES.filter(l => !task?.allowedLanguages || task.allowedLanguages.length === 0 || task.allowedLanguages.includes(l.value));

  if (loading) {
    return (
      <AppShell title="Playground">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Coding Playground" subtitle={task?.title || 'Solving Task'}>
      <div className={`flex flex-col h-[calc(100vh-160px)] min-h-[600px] ${isTimeUp ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 bg-[var(--surface)] p-3 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-all">
              <Lucide.ArrowLeft size={18} />
            </button>
            <div className="h-6 w-px bg-[var(--border)] mx-1" />
            <h1 className="text-sm font-black uppercase tracking-tight hidden sm:block">{task?.title}</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] rounded-full border border-[var(--success)]/20">
              <Lucide.Zap size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase">{task?.points} PTS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]'}`}>
              <Lucide.Clock size={14} />
              <span className="text-[11px] font-black">{isTimeUp ? 'TIME UP' : formatTime(timeLeft)}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                <Lucide.ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex border-b border-[var(--border)] mb-4 bg-[var(--surface)] rounded-xl overflow-hidden p-1 gap-1">
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'code' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'}`}
          >
            <Lucide.Code2 size={14} /> Code
          </button>
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'input' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'}`}
          >
            <Lucide.FileText size={14} /> Input
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'output' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'}`}
          >
            <Lucide.Activity size={14} /> Output
          </button>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden relative ${isFullScreen ? 'fixed inset-0 z-[100] bg-[var(--background)] p-4' : ''}`}>
          
          {/* Editor Column (Desktop Left) */}
          <div className={`${isFullScreen ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col glass-panel rounded-2xl overflow-hidden border border-[var(--border)] ${(activeTab !== 'code' && !isFullScreen) ? 'hidden lg:flex' : 'flex'}`}>
            {/* Toolbar */}
            <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="h-4 w-px bg-[var(--border)] mx-1" />
                <select 
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    if (task?.starterCode?.[e.target.value]) {
                      setCode(task.starterCode[e.target.value]);
                    }
                  }}
                  disabled={task?.allowedLanguages && task.allowedLanguages.length === 1}
                  className="bg-[var(--background)] text-[11px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg border border-[var(--border)] outline-none cursor-pointer disabled:opacity-70"
                >
                  {allowedLangs.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest hidden sm:inline">
                  main.{currentLang?.ext}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-all text-[var(--muted)]"
                  title={isFullScreen ? "Minimize" : "Maximize"}
                >
                  {isFullScreen ? <Lucide.Minimize2 size={16} /> : <Lucide.Maximize2 size={16} />}
                </button>
                <button 
                  onClick={runCode}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isRunning ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lucide.Play size={12} fill="currentColor" />}
                  Run
                </button>
                <button 
                  onClick={() => submitTask()}
                  disabled={isRunning || isSubmitting || !code.trim()}
                  className="px-4 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lucide.CheckCircle2 size={12} />}
                  Submit
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-[400px]">
              <Editor
                height="100%"
                language={language === 'javascript' ? 'javascript' : language === 'cpp' ? 'cpp' : language}
                theme={editorTheme}
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  fontSize: 15,
                  minimap: { enabled: false },
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  roundedSelection: true,
                  contextmenu: false,
                }}
              />
            </div>
          </div>

          {/* Right Column (Desktop Right) */}
          <div className={`${isFullScreen ? 'hidden' : 'lg:col-span-5'} flex flex-col gap-4 overflow-hidden ${(activeTab === 'code' && !isFullScreen) ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Task View / Input Tab */}
            {(activeTab === 'code' || activeTab === 'input') && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Task Description (Desktop only or when needed) */}
                <div className="glass-panel rounded-2xl p-5 flex-1 overflow-y-auto hidden lg:block">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-4">Problem Context</h2>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-[var(--foreground)]">
                      {task?.description}
                    </p>
                  </div>
                </div>

                {/* Stdin Input */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col h-[200px] lg:h-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Input (Stdin)</h2>
                    <span className="text-[9px] font-bold text-blue-500/50">Used during execution</span>
                  </div>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter manual input here..."
                    className="flex-1 bg-[var(--background)]/50 border border-[var(--border)] rounded-xl p-4 text-[13px] font-mono outline-none focus:border-[var(--primary)]/50 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Output Panel (Desktop Right or Tab) */}
            {(activeTab === 'output' || activeTab === 'code') && (
              <div className={`rounded-2xl flex flex-col overflow-hidden bg-[#0A0A0A] border border-[var(--border)] shadow-2xl ${activeTab === 'output' ? 'flex-1' : 'h-[300px]'}`} style={{ backdropFilter: 'none' }}>
                <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#111]">
                  <div className="flex items-center gap-2">
                    <Lucide.Terminal size={14} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Terminal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setExecResult(null)}
                      className="text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                    >
                      Clear
                    </button>
                    {execResult && (
                      <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${execResult.status === 'PASS' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
                        {execResult.status}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-5 font-mono text-[13px] overflow-auto custom-scrollbar bg-[#0A0A0A] selection:bg-white/20">
                  {!execResult && !isRunning && !testResults && (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 gap-3">
                      <Lucide.Activity size={32} className="opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-50">Ready for code execution</p>
                    </div>
                  )}

                  {isRunning && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Compiling & Running...</span>
                    </div>
                  )}

                  {execResult && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      {/* Compilation Error */}
                      {execResult.compileError && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2">
                            <Lucide.AlertCircle size={10} /> Compilation Error
                          </h3>
                          <pre className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-red-400 whitespace-pre-wrap break-all leading-relaxed shadow-inner">{execResult.compileError}</pre>
                        </div>
                      )}

                      {/* Runtime Error / Stderr */}
                      {execResult.stderr && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2">
                             <Lucide.XCircle size={10} /> Runtime Error
                          </h3>
                          <pre className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-red-400 whitespace-pre-wrap break-all leading-relaxed shadow-inner">{execResult.stderr}</pre>
                        </div>
                      )}

                      {/* Output */}
                      {execResult.stdout && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                               <Lucide.CheckCircle2 size={10} /> Standard Output
                            </h3>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(execResult.stdout);
                                toast.success('Output copied!');
                              }}
                              className="text-[8px] font-black text-white/20 hover:text-white transition-colors"
                            >
                              COPY
                            </button>
                          </div>
                          <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-xl text-white/90 whitespace-pre-wrap break-all leading-relaxed shadow-inner">{execResult.stdout}</pre>
                        </div>
                      )}

                      {/* Success / No Output */}
                      {!execResult.stdout && !execResult.stderr && !execResult.compileError && (
                        <div className="text-white/30 italic flex items-center gap-2 py-4 justify-center border border-white/5 rounded-xl bg-white/[0.01]">
                          <Lucide.ShieldCheck size={14} className="text-green-500/50" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Process finished with exit code 0</span>
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="flex items-center gap-6 pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
                        <div className="flex items-center gap-2">
                          <Lucide.Clock size={12} />
                          <span>{execResult.time}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lucide.Activity size={12} />
                          <span>{Math.round(execResult.memory / 1024)}KB</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission Test Results */}
                  {testResults && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500/50 mb-3 border-b border-blue-500/10 pb-2">Test Case Results</h3>
                      {testResults.map((res, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            {res.status === 'Accepted' ? <Lucide.CheckCircle2 size={16} className="text-green-500" /> : <Lucide.XCircle size={16} className="text-red-500" />}
                            <span className="text-[11px] font-bold text-white/80">Test Case #{res.testCase}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{res.time}s</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${res.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                              {res.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Floating Actions */}
        <div className="lg:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <button 
            onClick={runCode}
            disabled={isRunning || isSubmitting}
            className="w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
          >
            {isRunning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lucide.Play size={20} fill="currentColor" />}
          </button>
          <button 
            onClick={() => submitTask()}
            disabled={isRunning || isSubmitting || !code.trim()}
            className="w-14 h-14 bg-[var(--foreground)] text-[var(--background)] rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lucide.Send size={20} />}
          </button>
        </div>

      </div>
    </AppShell>
  );
}

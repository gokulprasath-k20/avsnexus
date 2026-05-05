'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getApiUrl } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  moduleId: string;
  starterCode?: Record<string, string>;
}

const LANGUAGES = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'Node.js' },
];

export default function PlaygroundClient() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

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
          setTimeLeft(data.duration);
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
        
        if (taskData.task.type !== 'coding') {
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

        setTask(taskData.task);
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

  const [execResult, setExecResult] = useState<{
    stdout: string;
    stderr: string;
    compileError: string;
    time: string;
    memory: number;
  } | null>(null);

  const runCode = async () => {
    if (isTimeUp) return;
    if (!language) {
      toast.error('Please select a language first');
      return;
    }
    setIsRunning(true);
    setConsoleOpen(true);
    setExecResult(null);
    setOutput('Compiling and running code...\n');
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
          memory: 0
        });
      } else {
        setExecResult(data);
      }
    } catch (err) {
      toast.error('Network error');
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
    try {
      const res = await fetch(getApiUrl('/api/submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          moduleId: task?.moduleId,
          code,
          language,
          input, // Store the input used
          output: execResult?.stdout || '',
          error: execResult?.stderr || '',
          compileError: execResult?.compileError || '',
          executionTime: execResult?.time || '0',
          memory: execResult?.memory || 0,
          status: isAuto ? 'fail' : 'needs_review',
          startedAt,
          isAutoSubmitted: !!isAuto
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      toast.success(isAuto ? 'Time up! Progress saved.' : 'Solution submitted successfully!');
      router.push('/student-dashboard');
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

  if (loading) {
    return (
      <AppShell title="Playground">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="spinner" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Code Challenge Playground" subtitle={task?.title || 'Solving Task'}>
      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Module
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-full">
            <ShieldCheck size={12} className="text-[var(--success)]" />
            <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-tight">Verified Session</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 border rounded-full transition-all ${timeLeft < 60 ? 'bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)] animate-pulse' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--primary)]'}`}>
            <Clock size={12} />
            <span className="text-[10px] font-black uppercase tracking-tight">
              {isTimeUp ? 'TIME UP' : formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[500px] ${isTimeUp ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Left: Task Details */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className="glass-panel rounded-2xl p-5 flex-1 overflow-y-auto">
            <h2 className="text-sm font-black text-[var(--foreground)] mb-3 flex items-center justify-between">
              Problem Description
              <span className="text-[10px] bg-[var(--primary)] text-white px-2 py-0.5 rounded-md">+{task?.points} PTS</span>
            </h2>
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-[12px] text-[var(--foreground)] leading-relaxed font-medium whitespace-pre-wrap">
                {task?.description}
              </p>
            </div>
            
            <div className="mt-6 p-4 bg-[var(--background)]/50 rounded-xl border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-[var(--warning)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--warning)]">Instructions</span>
              </div>
              <ul className="text-[10px] text-[var(--muted)] font-bold space-y-1.5 list-disc pl-4">
                <li>Choose your preferred language from the dropdown.</li>
                <li>Write your solution in the editor provided.</li>
                <li>Use the 'Run' button to test your code with stdin.</li>
                <li>Submit your solution once you are confident.</li>
              </ul>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-[10px] font-black uppercase text-[var(--muted)] tracking-widest mb-3">Custom Input (Stdin)</h3>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter program input here..."
              className="w-full h-24 bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[12px] font-mono outline-none focus:border-[var(--primary)] transition-all resize-none"
            />
          </div>
        </div>

        {/* Right: Editor & Console */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          <div className="glass-panel rounded-2xl flex flex-col overflow-hidden relative">
            {/* Editor Toolbar */}
            <div className="h-10 border-b border-[var(--border)] flex items-center justify-between px-4 bg-[var(--surface-hover)]">
              <div className="flex items-center gap-4">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[var(--background)] px-3 py-1 rounded-md text-[10px] font-black border border-[var(--border)] outline-none text-[var(--foreground)] cursor-pointer hover:border-[var(--primary)] transition-colors"
                >
                  <option value="" disabled>Select Language</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                <div className="w-px h-4 bg-[var(--border)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
                  {language ? `Main.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'java'}` : 'New File'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={runCode}
                  disabled={isRunning || !language}
                  className="px-4 py-1.5 bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
                  Run Code
                </button>
                <button 
                  onClick={() => submitTask()}
                  disabled={isSubmitting || !code.trim() || !language}
                  className="px-4 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send size={12} />}
                  Submit Solution
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[300px]">
              <Editor
                height="100%"
                language={language === 'javascript' ? 'javascript' : language === 'cpp' ? 'cpp' : language}
                theme={editorTheme}
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  roundedSelection: true,
                }}
              />
            </div>

            {/* Console */}
            <div 
              className={`border-t border-[var(--border)] transition-all duration-300 ${consoleOpen ? 'h-40' : 'h-8'} bg-[#0a0a0a] flex flex-col`}
            >
              <div 
                className="h-8 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5"
                onClick={() => setConsoleOpen(!consoleOpen)}
              >
                <div className="flex items-center gap-2 text-white/40">
                  <Terminal size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Execution Console</span>
                </div>
                {consoleOpen ? <ChevronDown size={14} className="text-white/40" /> : <ChevronUp size={14} className="text-white/40" />}
              </div>
              
              {consoleOpen && (
                <div className="flex-1 p-4 font-mono text-[12px] overflow-auto selection:bg-white/20 custom-scrollbar">
                  {!execResult && !isRunning && (
                    <span className="text-white/20 italic font-bold">Waiting for execution output...</span>
                  )}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-white/40 animate-pulse">
                      <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" />
                      <span>{output}</span>
                    </div>
                  )}
                  {execResult && (
                    <div className="space-y-4">
                      {execResult.compileError && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-[var(--danger)] mb-1 opacity-60">Compilation Error</div>
                          <pre className="text-[var(--danger)] whitespace-pre-wrap break-all leading-relaxed bg-[var(--danger)]/5 p-3 rounded-lg border border-[var(--danger)]/10">{execResult.compileError}</pre>
                        </div>
                      )}
                      
                      {execResult.stderr && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-[var(--danger)] mb-1 opacity-60">Runtime Error</div>
                          <pre className="text-[var(--danger)] whitespace-pre-wrap break-all leading-relaxed bg-[var(--danger)]/5 p-3 rounded-lg border border-[var(--danger)]/10">{execResult.stderr}</pre>
                        </div>
                      )}

                      {execResult.stdout && (
                        <div>
                          <div className="text-[10px] font-black uppercase text-[var(--success)] mb-1 opacity-60">Standard Output</div>
                          <pre className="text-white/90 whitespace-pre-wrap break-all leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">{execResult.stdout}</pre>
                        </div>
                      )}

                      {!execResult.stdout && !execResult.stderr && !execResult.compileError && (
                        <div className="text-white/40 italic">Program executed successfully with no output.</div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                        <span>Time: {execResult.time}s</span>
                        <span>Memory: {Math.round(execResult.memory / 1024)}KB</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

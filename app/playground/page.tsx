'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, X, Maximize2, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function PlaygroundPage() {
  const { theme } = useTheme();
  const [code, setCode] = useState('print("Hello, World!")');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [input, setInput] = useState('');

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input }),
      });
      const data = await res.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.stdout || 'Program executed successfully with no output.');
      }
    } catch (err) {
      setOutput('Failed to execute code.');
      toast.error('Network error');
    } finally {
      setIsRunning(false);
    }
  };

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  return (
    <AppShell title="Playground" subtitle="Experimental Code Editor">
      <div 
        className={`fixed inset-0 z-50 bg-[var(--background)] flex flex-col transition-all duration-500 ease-in-out ${isFullscreen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {/* Fullscreen Header - Super Compact */}
        <div className="h-8 border-b border-[var(--border)] flex items-center justify-between px-3 bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Playground</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-[10px] font-bold border-none outline-none text-[var(--foreground)] cursor-pointer"
            >
              <option value="python">Python</option>
              <option value="javascript">Node.js</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={runCode}
              disabled={isRunning}
              className="px-2 py-0.5 bg-[var(--foreground)] text-[var(--background)] rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
            >
              {isRunning ? <div className="w-2.5 h-2.5 border-2 border-[var(--background)]/30 border-t-[var(--background)] rounded-full animate-spin" /> : <Play size={10} fill="currentColor" />}
              {isRunning ? '...' : 'Run'}
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button 
              onClick={() => setIsFullscreen(false)}
              className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 relative overflow-hidden bg-[var(--background)]">
          <Editor
            height="100%"
            language={language}
            theme={editorTheme}
            value={code}
            onChange={(v) => setCode(v || '')}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              letterSpacing: 0,
            }}
          />
        </div>

        {/* Integrated Console - Ultra Compact */}
        <div 
          className={`border-t border-[var(--border)] transition-all duration-300 ${consoleOpen ? 'h-1/4' : 'h-7'} bg-[#0a0a0a] flex flex-col`}
        >
          <div 
            className="h-7 flex items-center justify-between px-3 cursor-pointer hover:bg-white/5"
            onClick={() => setConsoleOpen(!consoleOpen)}
          >
            <div className="flex items-center gap-2 text-white/40">
              <Terminal size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">Output</span>
            </div>
            <div className="flex items-center gap-2">
               {isRunning && <span className="text-[8px] font-bold text-[var(--primary)] animate-pulse">EXECUTING...</span>}
               {consoleOpen ? <ChevronDown size={12} className="text-white/40" /> : <ChevronUp size={12} className="text-white/40" />}
            </div>
          </div>
          
          {consoleOpen && (
            <div className="flex-1 p-3 font-mono text-[11px] overflow-auto text-white/80 selection:bg-white/20">
              {output ? (
                <pre className="whitespace-pre-wrap break-all leading-tight">{output}</pre>
              ) : (
                <span className="text-white/20 italic">Run code to see output...</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Page View (The "Snippet") */}
      <div className="max-w-3xl">
        <div className="mb-4">
          <h1 className="text-lg font-black text-[var(--foreground)] tracking-tight mb-0.5">Playground</h1>
          <p className="text-[9px] text-[var(--muted)] font-black uppercase tracking-widest">Interactive IDE • Fullscreen Mode</p>
        </div>

        <div 
          className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden cursor-pointer hover:border-[var(--foreground)] transition-all duration-300"
          onClick={() => setIsFullscreen(true)}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] z-10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg scale-95 group-hover:scale-100 transition-all duration-300">
              <Maximize2 size={12} />
              <span className="text-[10px] font-black uppercase tracking-tight">Expand Editor</span>
            </div>
          </div>

          <div className="p-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
              </div>
              <span className="ml-1.5 text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}</span>
            </div>
            <Settings size={12} className="text-[var(--muted)]" />
          </div>

          <div className="h-32 overflow-hidden pointer-events-none opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-500">
             <Editor
              height="100%"
              language={language}
              theme={editorTheme}
              value={code}
              options={{
                readOnly: true,
                fontSize: 11,
                minimap: { enabled: false },
                scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                lineNumbers: 'off',
                folding: false,
                renderLineHighlight: 'none',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
             <h3 className="text-[9px] font-black uppercase text-[var(--muted)] tracking-widest mb-2">Stdin</h3>
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Input here..."
               className="w-full h-16 bg-[var(--background)] border border-[var(--border)] rounded-md p-2 text-[11px] font-mono outline-none focus:border-[var(--foreground)] transition-colors"
             />
          </div>
          <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded bg-[var(--foreground)]/5 text-[var(--foreground)] flex items-center justify-center">
                   <Settings size={12} />
                </div>
                <h3 className="text-[10px] font-black text-[var(--foreground)] uppercase">Environment</h3>
             </div>
             <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-tight">Python 3.10 • 512MB RAM • 5s Timeout</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed or installed
    if (
      typeof window !== 'undefined' &&
      (localStorage.getItem('pwaPromptDismissed') || window.matchMedia('(display-mode: standalone)').matches)
    ) {
      return;
    }

    // Always show prompt after 2 seconds to ensure visibility
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback if event was missed or browser doesn't support it
      alert("To install: Tap your browser's menu (⋮ or Share) and select 'Add to Home Screen' or 'Install App'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaPromptDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed right-4 z-[100] animate-fade-up"
      style={{ bottom: 'calc(1rem + var(--safe-bottom))' }}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] shadow-md rounded-xl p-3 flex flex-col gap-2 max-w-[300px]">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-black text-xs shrink-0">
              AV
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--foreground)] leading-tight">AVS Nexus</p>
              <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">Install for a better experience</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1 -mr-1 -mt-1 shrink-0">
            <X size={14} />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full mt-1 bg-[var(--foreground)] text-[var(--background)] rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
        >
          <Download size={12} strokeWidth={2.5} />
          Install App
        </button>
      </div>
    </div>
  );
}

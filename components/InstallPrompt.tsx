'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

// Singleton: share the deferred prompt across all components
let _deferredPrompt: any = null;
const _listeners: Set<() => void> = new Set();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    notifyListeners();
  });
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(_deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    setPrompt(_deferredPrompt);

    const update = () => {
      setPrompt(_deferredPrompt);
      if (!_deferredPrompt) setIsInstalled(true);
    };
    _listeners.add(update);
    return () => { _listeners.delete(update); };
  }, []);

  const triggerInstall = async () => {
    if (!_deferredPrompt) return false;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    notifyListeners();
    return outcome === 'accepted';
  };

  return { prompt, isInstalled, triggerInstall };
}

// ─── Install Button (for TopBar) ───────────────────────────────────────────
export function InstallButton() {
  const { prompt, isInstalled, triggerInstall } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  // Don't show in standalone PWA mode or if Chrome hasn't fired beforeinstallprompt
  if (isInstalled || !prompt) return null;

  const handleClick = async () => {
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={installing}
      title="Install AVS Nexus as an app"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: '800',
        cursor: installing ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        opacity: installing ? 0.7 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        whiteSpace: 'nowrap',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <Download size={10} strokeWidth={2.5} />
      {installing ? 'Installing…' : 'Install'}
    </button>
  );
}

// ─── Update Toast ───────────────────────────────────────────────────────────
export function UpdateToast() {
  const [show, setShow] = useState(false);
  const [worker, setWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setWorker(sw);
            setShow(true);
          }
        });
      });
      reg.update().catch(() => {});
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  if (!show) return null;

  const handleUpdate = () => {
    worker?.postMessage({ type: 'SKIP_WAITING' });
    setShow(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 2rem)',
        maxWidth: '360px',
        background: 'var(--foreground)',
        color: 'var(--background)',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <RefreshCw size={14} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '12px', fontWeight: '700', flex: 1 }}>
        New version available!
      </span>
      <button
        onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, padding: '2px' }}
      >
        <X size={12} />
      </button>
      <button
        onClick={handleUpdate}
        style={{
          background: 'var(--primary)', color: 'white', border: 'none',
          borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
          fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Update
      </button>
    </div>
  );
}

// ─── Legacy default export (kept for layout.tsx import) ─────────────────────
export default function InstallPrompt() {
  return <UpdateToast />;
}

'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share, RefreshCw } from 'lucide-react';

type Platform = 'android' | 'ios' | 'desktop' | 'other';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop';
  return 'other';
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const plat = detectPlatform();
    setPlatform(plat);

    // Don't show on desktop or if already installed
    if (plat === 'desktop' || isAlreadyInstalled()) return;

    // Don't show if permanently dismissed
    const dismissed = localStorage.getItem('pwaPromptDismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Re-show after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Capture beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide if user installs
    const installedHandler = () => setShowPrompt(false);
    window.addEventListener('appinstalled', installedHandler);

    // Show prompt after 4 seconds (non-intrusive)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 4000);

    // --- Service Worker Update Detection ---
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setUpdateWorker(newWorker);
              setShowUpdateToast(true);
            }
          });
        });

        // Check for update now
        reg.update().catch(() => {});
      });

      // Listen for controlling SW change → auto reload
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    if (updateWorker) {
      updateWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateToast(false);
  };

  return (
    <>
      {/* ── Update Available Toast ── */}
      {showUpdateToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-up"
          style={{ width: 'calc(100% - 2rem)', maxWidth: '360px' }}
        >
          <div
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <RefreshCw size={14} />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>
                New version available!
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', shrink: 0 } as any}>
              <button
                onClick={() => setShowUpdateToast(false)}
                style={{
                  fontSize: '11px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'inherit',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Later
              </button>
              <button
                onClick={handleUpdate}
                style={{
                  fontSize: '11px',
                  background: 'var(--primary)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Install Prompt ── */}
      {showPrompt && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[100] animate-fade-up"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))', width: 'calc(100% - 2rem)', maxWidth: '340px' }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              {/* App Icon */}
              <div
                style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: '900', flexShrink: 0,
                  letterSpacing: '-0.03em',
                }}
              >
                AV
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--foreground)', lineHeight: '1.2', marginBottom: '2px' }}>
                  AVS Nexus
                </p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.3' }}>
                  {platform === 'ios'
                    ? 'Add to Home Screen for the best experience'
                    : 'Install for fast, offline-ready access'}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: '4px', flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* iOS: Manual guide */}
            {platform === 'ios' ? (
              <div
                style={{
                  background: 'var(--surface-hover)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: 'var(--foreground)',
                  lineHeight: '1.6',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: '700' }}>
                  <Share size={11} /> How to install on iPhone
                </div>
                <ol style={{ margin: 0, paddingLeft: '16px', color: 'var(--muted)' }}>
                  <li>Tap the <strong style={{ color: 'var(--foreground)' }}>Share</strong> button <span style={{ fontSize: '13px' }}>⬆</span> in Safari</li>
                  <li>Scroll down → tap <strong style={{ color: 'var(--foreground)' }}>Add to Home Screen</strong></li>
                  <li>Tap <strong style={{ color: 'var(--foreground)' }}>Add</strong></li>
                </ol>
              </div>
            ) : (
              /* Android / Chrome: Install button */
              <button
                onClick={handleInstall}
                disabled={installing || !deferredPrompt}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: installing ? 'var(--border)' : 'var(--foreground)',
                  color: 'var(--background)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: installing || !deferredPrompt ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'opacity 0.15s, transform 0.1s',
                  opacity: !deferredPrompt ? 0.5 : 1,
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Download size={13} strokeWidth={2.5} />
                {installing ? 'Installing...' : 'Install App'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

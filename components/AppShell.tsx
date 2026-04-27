'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-h-screen md:ml-[160px]"
        style={{ 
          transition: 'margin-left 0.2s ease-in-out',
          paddingBottom: 'calc(52px + var(--safe-bottom))',
        }}
      >
        <TopBar title={title} subtitle={subtitle} />
        <main
          className="animate-fade-up px-1.5 py-2 md:px-3 md:py-3 w-full max-w-7xl mx-auto"
          style={{
            flex: 1,
          }}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

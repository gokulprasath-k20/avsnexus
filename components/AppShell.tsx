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
        className="flex-1 flex flex-col min-h-screen pb-[52px] md:pb-0 md:ml-[190px]"
        style={{ 
          transition: 'margin-left 0.2s ease-in-out'
        }}
      >
        <TopBar title={title} subtitle={subtitle} />
        <main
          className="animate-fade-up px-2 py-3 md:px-4 md:py-4 w-full max-w-7xl mx-auto"
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

'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

import { useFCMToken } from '@/hooks/useFCMToken';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  useFCMToken();

  return (
    <div className="flex min-h-screen bg-transparent p-2 md:p-4">
      <div className="flex-1 flex flex-col md:flex-row glass-panel rounded-[32px] overflow-hidden shadow-2xl relative">
        <Sidebar />
        <div 
          className="flex-1 flex flex-col min-h-screen md:ml-0"
          style={{ 
            transition: 'margin-left 0.2s ease-in-out',
            paddingBottom: 'calc(52px + var(--safe-bottom))',
          }}
        >
          <TopBar title={title} subtitle={subtitle} />
          <main
            className="animate-fade-up px-3 py-4 md:px-6 md:py-6 w-full max-w-7xl mx-auto"
            style={{
              flex: 1,
            }}
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

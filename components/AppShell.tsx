'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        <TopBar title={title} subtitle={subtitle} />
        <main
          style={{
            flex: 1,
            padding: '28px',
            maxWidth: '1200px',
            width: '100%',
          }}
          className="animate-fade-up"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from '@/components/InstallPrompt';
import PushNotificationManager from '@/components/PushNotificationManager';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AVS Nexus — Skill Evaluation Platform',
  description:
    'A modular student skill evaluation platform with coding challenges, MCQ, and file upload assessments.',
  keywords: ['skill evaluation', 'coding challenges', 'student platform', 'avs nexus'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.variable}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxShadow: 'var(--shadow-md)',
                },
              }}
            />
            <InstallPrompt />
            <PushNotificationManager />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

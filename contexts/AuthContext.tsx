'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseBrowser';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  registerNumber?: string;
  email?: string;
  role: 'student' | 'superadmin' | 'moduleAdmin' | 'admin';
  department?: string;
  year?: number;
  section?: string;
  assignedModuleType?: 'coding' | 'mcq' | 'file_upload';
  totalPoints: number;
  avatar?: string;
  category?: 'elite' | 'non-elite';
  currentStreak?: number;
  lastCompletedDate?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (name: string, registerNumber: string, password: string, department: string, year: number, category: string, section: string, role?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const syncUserWithBackend = async (_supabaseUser: any) => {
    try {
      // Use getApiUrl so Capacitor WebView uses full production URL
      const res = await fetch(getApiUrl('/api/auth/me'));
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Error syncing user:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await syncUserWithBackend(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    await syncUserWithBackend(null);
  };

  const login = async (identifier: string, password: string) => {
    let email = identifier;
    if (!identifier.includes('@')) {
      email = `${identifier}@avs.com`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Use getApiUrl — critical for Capacitor APK to reach the Vercel backend
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseId: data.user.id, email }),
    });

    const backendData = await res.json();
    if (!res.ok) throw new Error(backendData.error || 'Backend sync failed');

    setUser(backendData.user);

    const userRole = backendData.user.role.toLowerCase();
    if (userRole === 'student') {
      router.push('/student-dashboard');
    } else if (userRole === 'superadmin') {
      router.push('/superadmin-dashboard');
    } else {
      router.push('/admin-dashboard/modules');
    }
  };

  const signup = async (
    name: string,
    registerNumber: string,
    password: string,
    department: string,
    year: number,
    category: string,
    section: string,
    role: string = 'student',
    email?: string
  ) => {
    const internalEmail = email || `${registerNumber}@avs.com`;

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: { name, registerNumber, role }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    // Use getApiUrl for Capacitor compatibility
    const res = await fetch(getApiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseId: data.user.id,
        name,
        registerNumber,
        department,
        year,
        category,
        section,
        role,
        email: internalEmail
      }),
    });

    const backendData = await res.json();
    if (!res.ok) throw new Error(backendData.error || 'MongoDB sync failed');

    setUser(backendData.user);

    const userRole = backendData.user.role.toLowerCase();
    if (userRole === 'student') {
      router.push('/student-dashboard');
    } else if (userRole === 'superadmin') {
      router.push('/superadmin-dashboard');
    } else {
      router.push('/admin-dashboard/modules');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

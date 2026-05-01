'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  login: (registerNumber: string, password: string) => Promise<void>;
  signup: (name: string, registerNumber: string, password: string, department: string, year: number, category: string, section: string, role?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    const userRole = data.user.role.toLowerCase();
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
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        registerNumber, 
        password, 
        department, 
        year, 
        category, 
        section,
        role,
        email
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    setUser(data.user);
    
    const userRole = data.user.role.toLowerCase();
    if (userRole === 'student') {
      router.push('/student-dashboard');
    } else if (userRole === 'superadmin') {
      router.push('/superadmin-dashboard');
    } else {
      router.push('/admin-dashboard/modules');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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

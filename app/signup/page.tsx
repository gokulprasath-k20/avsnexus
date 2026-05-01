'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('1');
  const [section, setSection] = useState('A');
  const [category, setCategory] = useState('non-elite');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password || !registerNumber || !department || !year || !section) {
      return toast.error('Please fill in all required fields');
    }
    
    if (!/^\d{12}$/.test(registerNumber)) {
      return toast.error('Register number must be exactly 12 digits');
    }

    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup(name, registerNumber, password, department, parseInt(year), category, section);
      toast.success('Account created! Welcome to AVS Nexus.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--background)',
    color: 'var(--foreground)',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const isValid = name && /^\d{12}$/.test(registerNumber) && password.length >= 6;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '6vh',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'var(--foreground)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ color: 'var(--background)', fontSize: '18px', fontWeight: '700' }}>
              AV
            </span>
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Create your account
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Join AVS Nexus and start your skill journey
          </p>
        </div>



        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label htmlFor="registerNumber" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                Register Number
              </label>
              <input
                id="registerNumber"
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12 digit register number"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="department" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Department
                </label>
                <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle}>
                  {['CSE', 'IT', 'ECE', 'EEE', 'BME', 'AIDS', 'MECH', 'CIVIL', 'OTHER'].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Year of Study
                </label>
                <select id="year" value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle}>
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y.toString()}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="section" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Section
                </label>
                <select id="section" value={section} onChange={(e) => setSection(e.target.value)} style={inputStyle}>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="category" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                  Category
                </label>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option value="non-elite">Non-Elite</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading || !isValid}
              style={{
                width: '100%',
                padding: '10px',
                background: loading ? 'var(--border)' : 'var(--foreground)',
                color: 'var(--background)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading ? 'Creating account...' : (<>Create account <ArrowRight size={15} /></>)}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--muted)', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--foreground)', fontWeight: '500', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

const BrandMark: React.FC = () => (
  <div className="w-10 h-10 rounded-md border border-[#262C38] bg-[#0B0E14] flex items-center justify-center shrink-0">
    <span className="font-['JetBrains_Mono'] text-[#35D0B8] font-bold text-sm">{'>_'}</span>
  </div>
);

const Spinner: React.FC = () => (
  <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0B0E14] border-t-transparent" />
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!email || !password) {
      setFormError('❌ Please enter your email and password.');
      return;
    }

    if (password.length < 8) {
      setFormError('❌ Password must be at least 8 characters long.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError('❌ Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      // Error is already handled in AuthContext with toast
      // But we also want to show it in the form
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Invalid email or password. Please try again.';
      setFormError(`❌ ${errorMessage}`);
      setLoading(false);
    } finally {
      // Only set loading to false if we're not navigating
      // If navigation happens, the component will unmount
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <style>{FONT_IMPORT}</style>

      {/* Ambient editor-grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1A1F2B 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#35D0B8] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <BrandMark />
          <div>
            <p className="font-['JetBrains_Mono'] text-[#E7E9EE] font-bold text-lg leading-none">
              DevAssist<span className="text-[#35D0B8]">.</span>
            </p>
            <p className="font-['Inter'] text-[#5B6472] text-xs mt-1">
              AI agents for your dev workflow
            </p>
          </div>
        </div>

        {/* Terminal window card */}
        <div className="rounded-lg border border-[#262C38] bg-[#12161F] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262C38] bg-[#1A1F2B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2665E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#35D0B8]" />
            <span className="ml-2 font-['JetBrains_Mono'] text-[11px] text-[#5B6472] truncate">
              ~/devassist/auth/login.sh
            </span>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-8 py-8">
            <p className="font-['JetBrains_Mono'] text-xs text-[#5B6472] mb-1">
              <span className="text-[#35D0B8]">//</span> sign in to continue
            </p>
            <h1 className="font-['Inter'] text-2xl font-semibold text-[#E7E9EE] mb-6">
              Welcome back
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block font-['JetBrains_Mono'] text-xs text-[#9AA3B2] mb-1.5"
                >
                  <span className="text-[#5B6472]">$</span> email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full bg-[#0B0E14] border rounded-md px-3.5 py-2.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none transition-colors focus:ring-1 ${
                    formError && formError.includes('email') 
                      ? 'border-[#F2665E] focus:border-[#F2665E] focus:ring-[#F2665E]/40' 
                      : 'border-[#262C38] focus:border-[#35D0B8] focus:ring-[#35D0B8]/40'
                  }`}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-['JetBrains_Mono'] text-xs text-[#9AA3B2] mb-1.5"
                >
                  <span className="text-[#5B6472]">$</span> password
                  <span className="text-[#5B6472] ml-2 text-[10px]">
                    (min 8 characters)
                  </span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-[#0B0E14] border rounded-md px-3.5 py-2.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none transition-colors focus:ring-1 ${
                    formError && formError.includes('password') 
                      ? 'border-[#F2665E] focus:border-[#F2665E] focus:ring-[#F2665E]/40' 
                      : 'border-[#262C38] focus:border-[#35D0B8] focus:ring-[#35D0B8]/40'
                  }`}
                  required
                  autoComplete="current-password"
                />
                {/* Password strength indicator */}
                {password.length > 0 && password.length < 8 && (
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#F5A623] mt-1.5">
                    ⚠️ Password must be at least 8 characters
                  </p>
                )}
                {password.length >= 8 && (
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#35D0B8] mt-1.5">
                    ✓ Password length is good
                  </p>
                )}
              </div>

              {formError && (
                <div className="font-['JetBrains_Mono'] text-xs text-[#F2665E] border border-[#F2665E]/30 bg-[#F2665E]/10 rounded-md px-3 py-2.5">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#35D0B8] hover:bg-[#35D0B8]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0E14] font-['JetBrains_Mono'] font-semibold text-sm rounded-md py-2.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner />
                    authenticating...
                  </>
                ) : (
                  <>sign in →</>
                )}
              </button>
            </form>

            <p className="text-center font-['JetBrains_Mono'] text-xs text-[#5B6472] mt-6">
              <span className="text-[#35D0B8]">//</span> no account?{' '}
              <Link to="/register" className="text-[#35D0B8] hover:underline font-medium">
                register
              </Link>
            </p>
          </div>
        </div>

        {/* Feature strip */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6">
          {[
            { label: 'Code review', color: '#35D0B8' },
            { label: 'Bug triage', color: '#F5A623' },
            { label: 'SQL generation', color: '#5B9DF9' },
          ].map((f) => (
            <span
              key={f.label}
              className="font-['JetBrains_Mono'] text-[11px] text-[#5B6472]"
            >
              <span style={{ color: f.color }}>+</span> {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
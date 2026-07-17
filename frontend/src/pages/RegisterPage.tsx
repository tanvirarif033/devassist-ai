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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error: any) {
      // Error already handled in AuthContext
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const passwordValid = formData.password.length >= 8;

  const fields: {
    name: keyof typeof formData;
    label: string;
    type: string;
    placeholder: string;
  }[] = [
    { name: 'fullName', label: 'full_name', type: 'text', placeholder: 'John Doe' },
    { name: 'username', label: 'username', type: 'text', placeholder: 'johndoe' },
    { name: 'email', label: 'email', type: 'email', placeholder: 'you@company.com' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <style>{FONT_IMPORT}</style>

      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1A1F2B 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5B9DF9] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
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

        <div className="rounded-lg border border-[#262C38] bg-[#12161F] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262C38] bg-[#1A1F2B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2665E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#35D0B8]" />
            <span className="ml-2 font-['JetBrains_Mono'] text-[11px] text-[#5B6472] truncate">
              ~/devassist/auth/register.sh
            </span>
          </div>

          <div className="px-6 sm:px-8 py-8">
            <p className="font-['JetBrains_Mono'] text-xs text-[#5B6472] mb-1">
              <span className="text-[#35D0B8]">//</span> create your account
            </p>
            <h1 className="font-['Inter'] text-2xl font-semibold text-[#E7E9EE] mb-6">
              Get started
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {fields.map((f) => (
                <div key={f.name}>
                  <label
                    htmlFor={f.name}
                    className="block font-['JetBrains_Mono'] text-xs text-[#9AA3B2] mb-1.5"
                  >
                    <span className="text-[#5B6472]">$</span> {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    value={formData[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0B0E14] border border-[#262C38] rounded-md px-3.5 py-2.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none transition-colors focus:border-[#35D0B8] focus:ring-1 focus:ring-[#35D0B8]/40"
                    required
                  />
                </div>
              ))}

              <div>
                <label
                  htmlFor="password"
                  className="block font-['JetBrains_Mono'] text-xs text-[#9AA3B2] mb-1.5"
                >
                  <span className="text-[#5B6472]">$</span> password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="min 8 characters"
                  className="w-full bg-[#0B0E14] border border-[#262C38] rounded-md px-3.5 py-2.5 font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] outline-none transition-colors focus:border-[#35D0B8] focus:ring-1 focus:ring-[#35D0B8]/40"
                  required
                />
                <p
                  className={`font-['JetBrains_Mono'] text-[11px] mt-1.5 ${
                    formData.password.length === 0
                      ? 'text-[#5B6472]'
                      : passwordValid
                      ? 'text-[#35D0B8]'
                      : 'text-[#F5A623]'
                  }`}
                >
                  <span>{passwordValid ? '+' : formData.password.length === 0 ? '//' : '!'}</span>{' '}
                  min 8 characters {passwordValid ? '— looks good' : ''}
                </p>
              </div>

              {formError && (
                <p className="font-['JetBrains_Mono'] text-xs text-[#F2665E] border border-[#F2665E]/30 bg-[#F2665E]/10 rounded-md px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#35D0B8] hover:bg-[#35D0B8]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0E14] font-['JetBrains_Mono'] font-semibold text-sm rounded-md py-2.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner />
                    creating account...
                  </>
                ) : (
                  <>create account →</>
                )}
              </button>
            </form>

            <p className="text-center font-['JetBrains_Mono'] text-xs text-[#5B6472] mt-6">
              <span className="text-[#35D0B8]">//</span> already have an account?{' '}
              <Link to="/login" className="text-[#35D0B8] hover:underline font-medium">
                sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
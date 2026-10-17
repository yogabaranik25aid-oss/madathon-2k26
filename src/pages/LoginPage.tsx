import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('alex.rivera@reworkguard.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performLogin = async (loginIdentifier: string, loginPassword?: string) => {
    setError(null);
    const idToUse = (loginIdentifier || '').trim();
    const pwToUse = (loginPassword || '').trim();

    if (!idToUse || !pwToUse) {
      setError('Please provide your Employee ID or email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(idToUse, pwToUse);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(identifier, password);
  };

  const handleQuickLogin = async (acc: typeof demoAccounts[0]) => {
    setIdentifier(acc.email);
    setPassword('password123');
    await performLogin(acc.email, 'password123');
  };


  const demoAccounts = [
    {
      name: 'Sarah Connor',
      role: 'Engineering Manager / Lead',
      id: 'usr-1',
      empId: 'EMP-001',
      email: 'sarah.connor@reworkguard.io',
      badge: 'Manager Dashboard',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      name: 'Alex Rivera',
      role: 'Frontend Developer (React / TSX)',
      id: 'usr-2',
      empId: 'EMP-002',
      email: 'alex.rivera@reworkguard.io',
      badge: 'Frontend Workspace',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Devon Lee',
      role: 'Backend Developer (Node / Express)',
      id: 'usr-3',
      empId: 'EMP-003',
      email: 'devon.lee@reworkguard.io',
      badge: 'Backend Workspace',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Priya Sharma',
      role: 'QA Engineer / Test Lead',
      id: 'usr-4',
      empId: 'EMP-004',
      email: 'priya.sharma@reworkguard.io',
      badge: 'QA Verification',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'Marcus Vance',
      role: 'Database Designer (PostgreSQL / DDL)',
      id: 'usr-5',
      empId: 'EMP-005',
      email: 'marcus.vance@reworkguard.io',
      badge: 'Database Workspace',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Elena Rostova',
      role: 'Authorized HR Officer (Statutory Compliance)',
      id: 'usr-6',
      empId: 'EMP-006',
      email: 'elena.rostova@reworkguard.io',
      badge: 'HR Compliance',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      name: 'Acme Enterprise',
      role: 'Authorized Client Stakeholder',
      id: 'usr-8',
      empId: 'CLI-001',
      email: 'client@acmecorp.io',
      badge: 'Client Portal',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  ];

  const fillCredentials = (acc: typeof demoAccounts[0]) => {
    setIdentifier(acc.email);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-950/20 mb-4 ring-4 ring-white">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            ReworkGuard
          </h1>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">
            Engineering Accountability & Rework Tracking
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xl shadow-zinc-200/50 p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-900">Sign in to your workspace</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Authenticate using your registered Employee ID or company email.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Employee ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="EMP-002 or alex.rivera@reworkguard.io"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 text-zinc-900 transition-all font-medium placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-zinc-400">Demo: password123</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 text-zinc-900 transition-all font-medium placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white text-sm font-semibold shadow-md shadow-zinc-950/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="light" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Account to Fill Credentials</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => fillCredentials(acc)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 ${
                    identifier === acc.email 
                      ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950' 
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                  title="Click to fill credentials above"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950 truncate">
                      {acc.name} <span className="font-mono font-normal text-zinc-400 text-[11px]">({acc.empId})</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{acc.role}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${acc.badgeColor}`}>
                    {acc.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security and Architectural Notice */}
        <div className="text-center mt-6 text-xs text-zinc-500 leading-relaxed">
          <p>
            Role & authorization are verified strictly on the backend.
            <br />
            Passwords hashed with PBKDF2-SHA256 • Persistent server session.
          </p>
        </div>
      </div>
    </div>
  );
};

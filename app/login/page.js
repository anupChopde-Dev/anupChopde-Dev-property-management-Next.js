'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/api';
import Button from '../../components/Button';
import Input, { Label } from '../../components/Input';
import { Building2, Sparkles, ShieldCheck, Wallet, Zap } from 'lucide-react';

const highlights = [
  { icon: Building2, text: 'Track every property and room in one place' },
  { icon: Wallet, text: 'Collect rent and follow up on dues' },
  { icon: Zap, text: 'Log electricity bills with automatic totals' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-emerald-900/10 lg:grid-cols-2 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/40">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 p-10 text-white lg:flex">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Property Manager</span>
            </div>

            <h2 className="mt-10 text-3xl font-bold leading-tight tracking-tight">
              Rental management,
              <br />
              without the spreadsheet.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              A clean dashboard for rent, tenants and electricity bills.
            </p>

            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative inline-flex items-center gap-2 text-xs text-white/75">
            <Sparkles className="h-3.5 w-3.5" />
            September 2026 · collection on track
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Property Manager
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rental suite</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-white/5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Demo credentials
            </p>
            <div className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
              <p>owner@example.com</p>
              <p className="font-mono">password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

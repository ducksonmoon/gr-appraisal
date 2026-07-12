'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ACCESS_NOTE,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  UNIVERSITY_NAME,
} from '@/lib/brand';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const from = searchParams.get('from');
      router.replace(from && from.startsWith('/') && !from.startsWith('//') ? from : '/');
    }
  }, [loading, user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const from = searchParams.get('from');
      router.replace(from && from.startsWith('/') && !from.startsWith('//') ? from : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود. اطلاعات را بررسی کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4" dir="rtl">
        <p className="text-sm text-[var(--text-muted)]">در حال بررسی نشست…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]" dir="rtl">
      <div className="border-b border-[var(--border)] bg-[var(--brand)] px-4 py-6 text-center text-white sm:py-8">
        <p className="text-xs font-medium tracking-wide text-white/75">{UNIVERSITY_NAME}</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{PRODUCT_NAME}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/80">{PRODUCT_TAGLINE}</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-sm border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-[var(--text)]">ورود کارکنان مجاز</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{ACCESS_NOTE}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-[var(--text)]">
                پست الکترونیکی سازمانی
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-[var(--text)]">
                رمز عبور
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="app-input"
                dir="ltr"
              />
            </div>

            {error ? (
              <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={submitting} className="app-btn-primary w-full min-h-11">
              {submitting ? 'در حال ورود…' : 'ورود به سامانه'}
            </button>
          </form>

          <p className="mt-6 border-t border-[var(--border)] pt-4 text-center text-xs leading-relaxed text-[var(--text-muted)]">
            در صورت فراموشی رمز عبور یا نیاز به دسترسی، با واحد فناوری اطلاعات یا معاونت آموزشی هماهنگ کنید.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]" dir="rtl">
          <p className="text-sm text-[var(--text-muted)]">بارگذاری صفحه ورود…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

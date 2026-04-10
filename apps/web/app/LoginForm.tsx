'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const err = params.get('error');
  const [email, setEmail] = useState(
    process.env.NODE_ENV === 'development' ? 'admin@designworks.app' : ''
  );
  const [password, setPassword] = useState(process.env.NODE_ENV === 'development' ? '1234' : '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(err ? 'Sign-in failed. Try again.' : '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
    router.replace('/overview');
  }

  async function google() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
    });
  }

  return (
    <>
      <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'grid', gap: 0 }}>
        <div className="gw-field">
          <label htmlFor="login-email">Email address</label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            variant="auth"
            placeholder="you@resort.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="gw-field">
          <label htmlFor="login-password">Password</label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            variant="auth"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {message ? (
          <p style={{ color: 'var(--rust)', fontSize: 13, margin: '0 0 16px' }}>{message}</p>
        ) : null}
        <Button type="submit" variant="grove" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="gw-divider">or</div>
      <button
        type="button"
        className="gw-btn-outline-auth"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onClick={() => void google()}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ flexShrink: 0 }}>
          <path
            d="M14.68 7.1H8v2.67h3.79c-.16.88-.65 1.3-1.41 1.8v1.77h2.29A6.87 6.87 0 0015 8c0-.5-.05-.58-.32-1z"
            fill="#4285F4"
          />
          <path
            d="M8 15c1.9 0 3.5-.63 4.67-1.71l-2.3-1.8c-.63.43-1.43.68-2.37.68a4.25 4.25 0 01-4-2.9H1.54v1.82A7 7 0 008 15z"
            fill="#34A853"
          />
          <path
            d="M4 9.27A4.24 4.24 0 013.78 8c0-.46.08-.9.22-1.32V4.86H1.54A7 7 0 001 8c0 1.14.27 2.22.54 3.09L4 9.27z"
            fill="#FBBC05"
          />
          <path
            d="M8 3.75c1.03 0 1.96.36 2.7 1.06l2.02-2.02A7 7 0 001.54 4.86L4 6.68A4.2 4.2 0 018 3.75z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink3)', marginTop: 18, marginBottom: 0 }}>
        <Link href="/forgot-password" className="gw-link">
          Forgot password?
        </Link>
      </p>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink3)', marginTop: 8 }}>
        No account?{' '}
        <Link href="/signup" className="gw-link">
          Start free trial
        </Link>
      </p>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const err = params.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <main
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--paper)' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
        <h1 className="font-serif-heading text-center" style={{ fontSize: '1.75rem', marginTop: 0 }}>
          GeoWaypoint
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
          Sign in to manage resorts, maps, and sites.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 24, display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Password</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginTop: 4 }}
            />
          </div>
          {message ? (
            <p style={{ color: 'var(--rust)', fontSize: 13, margin: 0 }}>{message}</p>
          ) : null}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => void google()}
        >
          Continue with Google
        </button>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          <Link href="/forgot-password" style={{ color: 'var(--sky)' }}>
            Forgot password?
          </Link>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13 }}>
          <Link href="/signup" style={{ color: 'var(--canopy)', fontWeight: 600 }}>
            Start free trial
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex flex-col items-center justify-center p-8"
          style={{ background: 'var(--paper)' }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
            <p style={{ margin: 0, color: 'var(--ink3)' }}>Loading…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/overview`,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--paper)' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
        <h1 className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 0 }}>
          Forgot password
        </h1>
        {sent ? (
          <p style={{ color: 'var(--ink3)', fontSize: 14 }}>
            If an account exists for <strong>{email}</strong>, we sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} style={{ marginTop: 16, display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ marginTop: 4 }}
              />
            </div>
            {message ? <p style={{ color: 'var(--rust)', fontSize: 13 }}>{message}</p> : null}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
        <p style={{ marginTop: 20, fontSize: 13 }}>
          <Link href="/" style={{ color: 'var(--sky)' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

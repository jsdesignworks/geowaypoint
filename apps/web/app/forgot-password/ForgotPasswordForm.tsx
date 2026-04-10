'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ForgotPasswordForm() {
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

  if (sent) {
    return (
      <p style={{ color: 'var(--ink3)', fontSize: 14, margin: 0 }}>
        If an account exists for <strong>{email}</strong>, we sent a reset link. Check your inbox.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'grid', gap: 0 }}>
        <div className="gw-field">
          <label htmlFor="fp-email">Email</label>
          <Input
            id="fp-email"
            type="email"
            variant="auth"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {message ? <p style={{ color: 'var(--rust)', fontSize: 13 }}>{message}</p> : null}
        <Button type="submit" variant="grove" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, marginBottom: 0 }}>
        <Link href="/" className="gw-link">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

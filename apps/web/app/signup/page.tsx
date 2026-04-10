'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { slugifyResortName } from '@/lib/utils/slugify';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resortName, setResortName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const previewSlug = useMemo(() => slugifyResortName(resortName), [resortName]);
  const effectiveSlug = slugTouched ? slug : previewSlug;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) {
      setMessage('Please agree to the Terms.');
      return;
    }
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        data: {
          full_name: fullName,
          resort_name: resortName,
          resort_slug: effectiveSlug,
          onboarding_complete: false,
        },
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Check your email to verify your account, then continue onboarding.');
    router.refresh();
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
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
        <h1 className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 0 }}>
          Start free trial
        </h1>
        <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Your name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginTop: 4 }} />
          </div>
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
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Resort name</label>
            <Input
              value={resortName}
              onChange={(e) => {
                setResortName(e.target.value);
              }}
              required
              style={{ marginTop: 4 }}
            />
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '6px 0 0' }}>
              Slug preview: <strong>{previewSlug}</strong>
            </p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Slug (editable)</label>
            <Input
              value={slugTouched ? slug : previewSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyResortName(e.target.value));
              }}
              style={{ marginTop: 4 }}
            />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I agree to
            the Terms.
          </label>
          {message ? (
            <p style={{ color: message.includes('Check') ? 'var(--canopy)' : 'var(--rust)', fontSize: 13 }}>
              {message}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
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
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link href="/" style={{ color: 'var(--sky)' }}>
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

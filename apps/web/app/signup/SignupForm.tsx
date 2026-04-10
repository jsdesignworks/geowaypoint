'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { slugifyResortName } from '@/lib/utils/slugify';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SignupForm() {
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
    <>
      <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'grid', gap: 0 }}>
        <div className="gw-field">
          <label htmlFor="su-name">Your name</label>
          <Input
            id="su-name"
            variant="auth"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="gw-field">
          <label htmlFor="su-email">Email</label>
          <Input
            id="su-email"
            type="email"
            variant="auth"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="gw-field">
          <label htmlFor="su-pass">Password</label>
          <Input
            id="su-pass"
            type="password"
            variant="auth"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="gw-field">
          <label htmlFor="su-resort">Resort name</label>
          <Input
            id="su-resort"
            variant="auth"
            value={resortName}
            onChange={(e) => setResortName(e.target.value)}
            required
          />
          <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '6px 0 0' }}>
            Slug preview: <strong>{previewSlug}</strong>
          </p>
        </div>
        <div className="gw-field">
          <label htmlFor="su-slug">Slug (editable)</label>
          <Input
            id="su-slug"
            variant="auth"
            value={slugTouched ? slug : previewSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugifyResortName(e.target.value));
            }}
          />
        </div>
        <label
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I agree to the{' '}
          <Link href="/terms" className="gw-link">
            Terms
          </Link>
          .
        </label>
        {message ? (
          <p style={{ color: message.includes('Check') ? 'var(--canopy)' : 'var(--rust)', fontSize: 13 }}>
            {message}
          </p>
        ) : null}
        <Button type="submit" variant="grove" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <div className="gw-divider">or</div>
      <button type="button" className="gw-btn-outline-auth" onClick={() => void google()}>
        Continue with Google
      </button>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
        <Link href="/" className="gw-link">
          Already have an account? Sign in
        </Link>
      </p>
    </>
  );
}

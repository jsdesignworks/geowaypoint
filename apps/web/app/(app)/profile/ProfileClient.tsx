'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0] ?? '', last: '' };
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

function initials(first: string, last: string, email: string): string {
  const a = (first[0] ?? email[0] ?? '?').toUpperCase();
  const b = (last[0] ?? '').toUpperCase();
  return b ? `${a}${b}` : a;
}

export function ProfileClient({
  email,
  initialFullName,
  resortName,
}: {
  email: string;
  initialFullName: string;
  resortName: string | null;
}) {
  const initial = useMemo(() => splitName(initialFullName), [initialFullName]);
  const [firstName, setFirstName] = useState(initial.first);
  const [lastName, setLastName] = useState(initial.last);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function saveProfile() {
    setProfileLoading(true);
    const supabase = createClient();
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const { error } = await supabase.auth.updateUser({
      data: { full_name: full_name || null },
    });
    setProfileLoading(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Profile updated', 'success');
  }

  async function updatePassword() {
    if (!currentPw) {
      toast('Enter your current password.', 'error');
      return;
    }
    if (pw.length < 8) {
      toast('Use at least 8 characters.', 'error');
      return;
    }
    if (pw !== pw2) {
      toast('Passwords do not match.', 'error');
      return;
    }
    setPwLoading(true);
    const supabase = createClient();
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    });
    if (reauthErr) {
      setPwLoading(false);
      toast('Current password is incorrect.', 'error');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwLoading(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setCurrentPw('');
    setPw('');
    setPw2('');
    toast('Password updated', 'success');
  }

  async function signOutOthers() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Signed out other sessions', 'success');
  }

  const av = initials(firstName, lastName, email);

  return (
    <div style={{ maxWidth: 560, display: 'grid', gap: 16 }}>
      <section className="card" style={{ padding: 20 }} id="profile-personal">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Personal information
        </h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, var(--morning), var(--canopy))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 600,
              flexShrink: 0,
            }}
            aria-hidden
          >
            {av}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Button type="button" variant="outline" disabled style={{ marginBottom: 12 }}>
              Change photo
            </Button>
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '0 0 12px' }}>
              Photo upload is not available yet; your initials are shown instead.
            </p>
            <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600 }}>First name</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600 }}>Last name</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <Button variant="primary" disabled={profileLoading} onClick={() => void saveProfile()}>
                {profileLoading ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} id="profile-signin">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Sign-in
        </h2>
        <label style={{ fontSize: 11, fontWeight: 600 }}>Email</label>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>{email || '—'}</p>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 10 }}>
          To change your email address, contact support or use your auth provider&apos;s account settings.
        </p>
      </section>

      <section className="card" style={{ padding: 20 }} id="profile-resort">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Resort access
        </h2>
        {resortName ? (
          <p style={{ fontSize: 14, margin: '0 0 8px' }}>
            You are signed in as owner of <strong>{resortName}</strong>.
          </p>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '0 0 8px' }}>No resort linked to this account yet.</p>
        )}
        <Link href="/settings" className="btn btn-outline" style={{ display: 'inline-block', padding: '8px 14px', fontSize: 13 }}>
          Resort &amp; billing settings
        </Link>
      </section>

      <section className="card" style={{ padding: 20 }} id="profile-password">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Password
        </h2>
        <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Current password</label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              style={{ marginTop: 4 }}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>New password</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Confirm new password</label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <Button variant="primary" disabled={pwLoading} onClick={() => void updatePassword()}>
            {pwLoading ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} id="profile-sessions">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Active sessions
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Supabase does not expose a full device list in the browser. This session is active; you can revoke all
          others below.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r8)',
            background: 'var(--fog)',
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>This browser</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>Current session · active now</div>
          </div>
          <span className="pill pill-green" style={{ fontSize: 10 }}>
            Active
          </span>
        </div>
        <Button variant="outline" style={{ marginTop: 14 }} onClick={() => void signOutOthers()}>
          Sign out all other sessions
        </Button>
      </section>

      <section className="card" style={{ padding: 20 }} id="profile-danger">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Danger zone
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Deleting your account removes your resort and maps from GeoWaypoint after confirmation. Self-serve deletion
          is not enabled yet.
        </p>
        <Button variant="danger" style={{ marginTop: 12 }} disabled>
          Delete my account
        </Button>
      </section>
    </div>
  );
}

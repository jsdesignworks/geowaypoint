'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProfileClient({ email }: { email: string }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (pw.length < 8) {
      toast('Use at least 8 characters.', 'error');
      return;
    }
    if (pw !== pw2) {
      toast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setPw('');
    setPw2('');
    toast('Password updated', 'success');
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <section className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Account
        </h2>
        <label style={{ fontSize: 11, fontWeight: 600 }}>Email</label>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>{email || '—'}</p>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 12 }}>
          Avatar and display name use Supabase Auth metadata (spec §13).
        </p>
      </section>

      <section className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Password
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>New password</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Confirm</label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <Button variant="primary" disabled={loading} onClick={() => void updatePassword()}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Sessions &amp; danger zone
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Session list and “sign out everywhere” use Supabase dashboard / future API (§13). Delete account flow
          requires support confirmation — do not automate destructive deletes without legal review.
        </p>
      </section>
    </div>
  );
}

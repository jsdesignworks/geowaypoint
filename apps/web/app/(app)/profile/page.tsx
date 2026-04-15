import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from '@/app/(app)/profile/ProfileClient';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as { full_name?: string } | undefined;
  const { data: resort } = user
    ? await supabase.from('resorts').select('name').eq('owner_id', user.id).maybeSingle()
    : { data: null };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        className="card"
        style={{
          padding: '12px 16px',
          fontSize: 13,
          color: 'var(--ink2)',
          border: '1px solid var(--dew)',
          background: 'var(--morning)',
        }}
      >
        <strong>Tip:</strong> My profile is also under{' '}
        <Link href="/settings#sp-user-profile" style={{ color: 'var(--sky)', fontWeight: 600 }}>
          Settings → My profile
        </Link>{' '}
        with the rest of your account.
      </div>
      <ProfileClient
        email={user?.email ?? ''}
        initialFullName={meta?.full_name ?? ''}
        resortName={resort?.name ?? null}
      />
    </div>
  );
}

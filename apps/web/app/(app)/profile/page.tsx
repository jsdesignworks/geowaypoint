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
    <ProfileClient
      email={user?.email ?? ''}
      initialFullName={meta?.full_name ?? ''}
      resortName={resort?.name ?? null}
    />
  );
}

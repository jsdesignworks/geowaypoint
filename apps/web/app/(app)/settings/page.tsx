import { createClient } from '@/lib/supabase/server';
import { SettingsPageClient } from '@/app/(app)/settings/SettingsPageClient';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const meta = user.user_metadata as { full_name?: string } | undefined;
  const { data: resort } = await supabase
    .from('resorts')
    .select('id, name, slug, phone, logo_url, plan, ownerrez_integration_enabled')
    .eq('owner_id', user.id)
    .single();
  if (!resort) {
    return <p>No resort.</p>;
  }
  const { data: team } = await supabase.from('team_members').select('*').eq('resort_id', resort.id);
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return (
    <SettingsPageClient
      resort={resort}
      team={team ?? []}
      appOrigin={appOrigin}
      userEmail={user.email ?? ''}
      initialFullName={meta?.full_name ?? ''}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { MapsClient } from '@/app/(app)/maps/MapsClient';

export default async function MapsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const { data: resort } = await supabase
    .from('resorts')
    .select('id, plan')
    .eq('owner_id', user.id)
    .single();
  if (!resort) {
    return <p>No resort found.</p>;
  }
  const { data: maps } = await supabase
    .from('maps')
    .select('id, name, image_url, is_published, created_at')
    .eq('resort_id', resort.id)
    .order('created_at', { ascending: false });

  return (
    <MapsClient resortId={resort.id} initialMaps={maps ?? []} plan={resort.plan ?? 'starter'} />
  );
}

import { createClient } from '@/lib/supabase/server';
import { AnalyticsClient } from '@/app/(app)/analytics/AnalyticsClient';

export default async function AnalyticsPage() {
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
    return <p>No resort.</p>;
  }
  const { data: events } = await supabase
    .from('embed_events')
    .select('id, resort_id, map_id, site_id, event, created_at')
    .eq('resort_id', resort.id)
    .order('created_at', { ascending: false })
    .limit(8000);

  const { data: maps } = await supabase.from('maps').select('id, name').eq('resort_id', resort.id);

  return (
    <AnalyticsClient initialEvents={events ?? []} maps={maps ?? []} plan={resort.plan ?? 'starter'} />
  );
}

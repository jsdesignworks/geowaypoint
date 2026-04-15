import { createClient } from '@/lib/supabase/server';
import { EmbedPageClient } from '@/app/(app)/embed/EmbedPageClient';

export default async function EmbedApiPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const { data: resort } = await supabase
    .from('resorts')
    .select('id, slug, plan, ownerrez_integration_enabled')
    .eq('owner_id', user.id)
    .single();

  const { data: orToken } = resort
    ? await supabase.from('ownerrez_tokens').select('resort_id').eq('resort_id', resort.id).maybeSingle()
    : { data: null };

  const { data: sitesList } = resort
    ? await supabase
        .from('sites')
        .select('id, name, ownerrez_property_id')
        .eq('resort_id', resort.id)
        .order('name', { ascending: true })
    : { data: null };

  const { data: maps } = resort
    ? await supabase
        .from('maps')
        .select('id, name, is_published')
        .eq('resort_id', resort.id)
        .order('created_at', { ascending: false })
    : { data: null as null };

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://your-app.vercel.app';
  const cdnOrigin = 'https://cdn.geowaypoint.io/v1';

  return (
    <EmbedPageClient
      resortSlug={resort?.slug ?? 'your-slug'}
      maps={maps ?? []}
      publicBase={appOrigin}
      cdnOrigin={cdnOrigin}
      ownerRezIntegrationEnabled={!!resort?.ownerrez_integration_enabled}
      ownerRezConnected={!!orToken}
      siteMappings={sitesList ?? []}
      plan={resort?.plan ?? 'starter'}
    />
  );
}

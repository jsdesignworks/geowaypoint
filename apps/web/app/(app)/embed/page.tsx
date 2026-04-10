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
    .select('id, slug')
    .eq('owner_id', user.id)
    .single();
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
  const firstPublished = maps?.find((m) => m.is_published) ?? maps?.[0];
  const exampleMapId = firstPublished?.id ?? 'YOUR_MAP_UUID';

  const snippet = `<script src="${cdnOrigin}/embed.min.js" defer></script>
<div id="gw-map"
     data-resort="${resort?.slug ?? 'your-slug'}"
     data-map-id="${exampleMapId}"
     data-api-base="${appOrigin}"
     style="width:100%;min-height:520px;">
</div>`;

  return (
    <EmbedPageClient
      snippet={snippet}
      publicBase={appOrigin}
      webhookStatus="Not configured"
    />
  );
}

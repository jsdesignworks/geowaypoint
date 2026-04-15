import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditorClient } from './EditorClient';

type MapCore = {
  id: string;
  name: string;
  image_url: string | null;
  is_published: boolean | null;
  resort_id: string;
  guest_site_detail_mode?: string | null;
};

function isMissingGuestDetailColumnError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('guest_site_detail_mode') &&
    (m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find'))
  );
}

async function loadMapForEditor(
  supabase: ReturnType<typeof createClient>,
  mapId: string
): Promise<MapCore | null> {
  const full = await supabase
    .from('maps')
    .select('id, name, image_url, is_published, resort_id, guest_site_detail_mode')
    .eq('id', mapId)
    .single();

  if (!full.error && full.data) {
    return full.data as MapCore;
  }

  if (full.error && isMissingGuestDetailColumnError(full.error.message)) {
    const fallback = await supabase
      .from('maps')
      .select('id, name, image_url, is_published, resort_id')
      .eq('id', mapId)
      .single();
    if (!fallback.error && fallback.data) {
      return { ...(fallback.data as Omit<MapCore, 'guest_site_detail_mode'>), guest_site_detail_mode: 'popup' };
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- local diagnose Map Editor 404
    console.error('[editor] maps select failed', {
      mapId,
      message: full.error?.message,
      code: full.error?.code,
    });
  }
  return null;
}

export default async function EditorPage({ params }: { params: { mapId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  const map = await loadMapForEditor(supabase, params.mapId);
  if (!map) {
    notFound();
  }

  const { data: resort } = await supabase.from('resorts').select('slug, name').eq('id', map.resort_id).single();

  const { data: sites } = await supabase
    .from('sites')
    .select(
      'id, name, display_code, site_type, status, rate_night, max_length_ft, description, photo_url, pos_x, pos_y, ownerrez_property_id'
    )
    .eq('map_id', map.id)
    .order('created_at');

  return (
    <div className="editor-page-root">
      <EditorClient
        resortName={resort?.name ?? 'Resort'}
        map={{
          id: map.id,
          name: map.name,
          image_url: map.image_url,
          is_published: map.is_published,
          resort_slug: resort?.slug ?? '',
          guest_site_detail_mode: map.guest_site_detail_mode === 'sidebar' ? 'sidebar' : 'popup',
        }}
        initialSites={sites ?? []}
      />
    </div>
  );
}

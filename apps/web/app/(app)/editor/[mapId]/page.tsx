import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditorClient } from './EditorClient';

export default async function EditorPage({ params }: { params: { mapId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  const { data: map, error } = await supabase
    .from('maps')
    .select('id, name, image_url, is_published, resort_id, guest_site_detail_mode')
    .eq('id', params.mapId)
    .single();

  if (error || !map) {
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
          guest_site_detail_mode:
            (map as { guest_site_detail_mode?: string | null }).guest_site_detail_mode === 'sidebar'
              ? 'sidebar'
              : 'popup',
        }}
        initialSites={sites ?? []}
      />
    </div>
  );
}

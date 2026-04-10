import Link from 'next/link';
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
    .select('id, name, image_url, is_published, resort_id')
    .eq('id', params.mapId)
    .single();

  if (error || !map) {
    notFound();
  }

  const { data: resort } = await supabase
    .from('resorts')
    .select('slug')
    .eq('id', map.resort_id)
    .single();

  const { data: sites } = await supabase
    .from('sites')
    .select(
      'id, name, site_type, status, rate_night, max_length_ft, description, photo_url, pos_x, pos_y, ownerrez_property_id'
    )
    .eq('map_id', map.id)
    .order('created_at');

  return (
    <div className="editor-page-root">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <Link href="/maps" className="btn btn-outline" style={{ padding: '6px 12px' }}>
          ← Maps
        </Link>
        <span className="font-serif-heading" style={{ fontSize: '1.1rem' }}>
          {map.name}
        </span>
        {!map.is_published ? (
          <span className="pill pill-gray" style={{ fontSize: 11 }}>
            Draft — publish to embed
          </span>
        ) : null}
      </div>
      <EditorClient
        map={{
          id: map.id,
          name: map.name,
          image_url: map.image_url,
          is_published: map.is_published,
          resort_slug: resort?.slug ?? '',
        }}
        initialSites={sites ?? []}
      />
    </div>
  );
}

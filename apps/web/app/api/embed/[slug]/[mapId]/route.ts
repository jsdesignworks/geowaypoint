import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { slug: string; mapId: string } }) {
  try {
    const admin = createAdminClient();
    const { data: resort } = await admin.from('resorts').select('id, slug, name').eq('slug', params.slug).maybeSingle();
    if (!resort) {
      return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_JSON_HEADERS });
    }
    const { data: map } = await admin
      .from('maps')
      .select('id, name, image_url, is_published, resort_id')
      .eq('id', params.mapId)
      .maybeSingle();
    if (!map || map.resort_id !== resort.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_JSON_HEADERS });
    }
    if (!map.is_published) {
      return NextResponse.json({ error: 'not_published' }, { status: 403, headers: CORS_JSON_HEADERS });
    }
    const { data: sites } = await admin
      .from('sites')
      .select(
        'id, name, site_type, status, rate_night, description, photo_url, pos_x, pos_y, ownerrez_property_id'
      )
      .eq('map_id', map.id);
    return NextResponse.json(
      {
        resort: { slug: resort.slug, name: resort.name },
        map: { id: map.id, name: map.name, image_url: map.image_url },
        sites: sites ?? [],
      },
      { headers: CORS_JSON_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500, headers: CORS_JSON_HEADERS });
  }
}

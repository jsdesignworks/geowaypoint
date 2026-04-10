import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_JSON_HEADERS });
}

type Body = {
  slug?: string;
  mapId?: string;
  event?: string;
  siteId?: string | null;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS_JSON_HEADERS });
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const mapId = typeof body.mapId === 'string' ? body.mapId : '';
  const event = typeof body.event === 'string' ? body.event : '';
  if (!slug || !mapId || !event) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: CORS_JSON_HEADERS });
  }
  try {
    const admin = createAdminClient();
    const { data: resort } = await admin.from('resorts').select('id').eq('slug', slug).maybeSingle();
    if (!resort) {
      return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_JSON_HEADERS });
    }
    const { data: map } = await admin
      .from('maps')
      .select('id, resort_id, is_published')
      .eq('id', mapId)
      .maybeSingle();
    if (!map || map.resort_id !== resort.id || !map.is_published) {
      return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_JSON_HEADERS });
    }
    const siteId =
      typeof body.siteId === 'string' && body.siteId.length > 0 ? body.siteId : null;
    if (siteId) {
      const { data: site } = await admin.from('sites').select('id').eq('id', siteId).eq('map_id', mapId).maybeSingle();
      if (!site) {
        return NextResponse.json({ error: 'bad_site' }, { status: 400, headers: CORS_JSON_HEADERS });
      }
    }
    const { error } = await admin.from('embed_events').insert({
      resort_id: resort.id,
      map_id: mapId,
      site_id: siteId,
      event,
    });
    if (error) {
      return NextResponse.json({ error: 'insert_failed' }, { status: 500, headers: CORS_JSON_HEADERS });
    }
    return NextResponse.json({ ok: true }, { headers: CORS_JSON_HEADERS });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500, headers: CORS_JSON_HEADERS });
  }
}

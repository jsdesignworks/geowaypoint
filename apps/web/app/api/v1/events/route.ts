import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';
import { clientIp, rateLimitAllow } from '@/lib/http/rateLimit';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['map_view', 'marker_click', 'book_click']);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_JSON_HEADERS });
}

type Body = {
  slug?: string;
  mapId?: string;
  resort_slug?: string;
  map_id?: string;
  event?: string;
  siteId?: string | null;
  site_id?: string | null;
};

function normalizeEvent(raw: string): string {
  if (raw === 'site_click') {
    return 'marker_click';
  }
  return raw;
}

export async function POST(request: Request) {
  if (!rateLimitAllow(`events:${clientIp(request)}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: CORS_JSON_HEADERS });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS_JSON_HEADERS });
  }

  const slug = (typeof body.resort_slug === 'string' ? body.resort_slug : body.slug) ?? '';
  const mapId = (typeof body.map_id === 'string' ? body.map_id : body.mapId) ?? '';
  const eventRaw = typeof body.event === 'string' ? body.event : '';
  const event = normalizeEvent(eventRaw);

  if (!slug || !mapId || !event) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: CORS_JSON_HEADERS });
  }
  if (!ALLOWED.has(event)) {
    return NextResponse.json({ error: 'invalid_event' }, { status: 400, headers: CORS_JSON_HEADERS });
  }

  const siteIdRaw =
    typeof body.site_id === 'string'
      ? body.site_id
      : typeof body.siteId === 'string'
        ? body.siteId
        : null;
  const siteId = siteIdRaw && siteIdRaw.length > 0 ? siteIdRaw : null;

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

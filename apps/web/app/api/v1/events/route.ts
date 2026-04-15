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
  session_id?: string | null;
  sessionId?: string | null;
  client_seq?: number | null;
  clientSeq?: number | null;
};

const SESSION_ID_RE = /^[a-zA-Z0-9._:-]{8,80}$/;

function normalizeSessionId(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const s = raw.trim();
  if (!s || !SESSION_ID_RE.test(s)) {
    return null;
  }
  return s;
}

function normalizeClientSeq(raw: unknown): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0 || n > 1e12) {
    return null;
  }
  return Math.floor(n);
}

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

  const sessionId =
    normalizeSessionId(body.session_id) ?? normalizeSessionId(body.sessionId);
  const clientSeq = normalizeClientSeq(body.client_seq) ?? normalizeClientSeq(body.clientSeq);

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
    const row: Record<string, unknown> = {
      resort_id: resort.id,
      map_id: mapId,
      site_id: siteId,
      event,
    };
    if (sessionId) {
      row.session_id = sessionId;
    }
    if (clientSeq !== null) {
      row.client_seq = clientSeq;
    }
    const { error } = await admin.from('embed_events').insert(row);
    if (error) {
      return NextResponse.json({ error: 'insert_failed' }, { status: 500, headers: CORS_JSON_HEADERS });
    }
    return NextResponse.json({ ok: true }, { headers: CORS_JSON_HEADERS });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500, headers: CORS_JSON_HEADERS });
  }
}

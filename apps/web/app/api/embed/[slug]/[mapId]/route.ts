import { NextResponse } from 'next/server';
import { resolvePublishedMapForEmbed } from '@/lib/embed/resolvePublishedMap';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';

export const dynamic = 'force-dynamic';

const CACHE_OK = { ...CORS_JSON_HEADERS, 'Cache-Control': 'public, max-age=300' };

export async function GET(_request: Request, { params }: { params: { slug: string; mapId: string } }) {
  try {
    const result = await resolvePublishedMapForEmbed(params.slug, params.mapId);
    if (result.status === 200) {
      return NextResponse.json(result.body, { headers: CACHE_OK });
    }
    return NextResponse.json(result.body, { status: result.status, headers: CORS_JSON_HEADERS });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500, headers: CORS_JSON_HEADERS });
  }
}

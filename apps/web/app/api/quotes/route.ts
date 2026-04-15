import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';
import { resolvePublishedMapForEmbed } from '@/lib/embed/resolvePublishedMap';

export const dynamic = 'force-dynamic';

type QuoteBody = {
  slug?: string;
  resort_slug?: string;
  mapId?: string;
  map_id?: string;
  siteId?: string;
  site_id?: string;
  PropertyId?: string;
  Arrival?: string;
  Departure?: string;
  Adults?: number;
  Children?: number;
  Pets?: number;
  GuestId?: string;
};

/**
 * Spec §9 / §15 — POST quotes → OwnerRez PaymentForm URL.
 * When OwnerRez is not configured or property missing, returns structured message.
 */
export async function POST(request: Request) {
  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return NextResponse.json({ paymentUrl: null, message: 'Invalid JSON' }, { status: 400, headers: CORS_JSON_HEADERS });
  }

  const slug = (body.resort_slug ?? body.slug) ?? '';
  const mapId = (body.map_id ?? body.mapId) ?? '';
  const siteId = (body.site_id ?? body.siteId) ?? '';

  if (!slug || !mapId || !siteId) {
    return NextResponse.json(
      { paymentUrl: null, message: 'resort_slug, map_id, and site_id are required' },
      { status: 400, headers: CORS_JSON_HEADERS }
    );
  }

  const resolved = await resolvePublishedMapForEmbed(slug, mapId);
  if (resolved.status !== 200) {
    return NextResponse.json({ paymentUrl: null, message: 'Map not available' }, { status: 403, headers: CORS_JSON_HEADERS });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from('sites')
    .select('ownerrez_property_id')
    .eq('id', siteId)
    .eq('map_id', mapId)
    .maybeSingle();

  const propertyId = body.PropertyId ?? site?.ownerrez_property_id ?? '';
  if (!propertyId) {
    return NextResponse.json(
      {
        paymentUrl: null,
        message: 'Site is not mapped to an OwnerRez property (spec §15).',
      },
      { headers: CORS_JSON_HEADERS }
    );
  }

  const base = process.env.OWNERREZ_API_BASE ?? 'https://app.ownerrez.com';
  const quotesUrl = `${base}/api/quotes`;

  const clientId = process.env.OWNERREZ_CLIENT_ID;
  const resortRow = await admin.from('resorts').select('id').eq('slug', slug).single();
  const resortId = resortRow.data?.id;
  let accessToken: string | null = null;
  if (resortId) {
    const { data: tok } = await admin.from('ownerrez_tokens').select('access_token').eq('resort_id', resortId).maybeSingle();
    accessToken = tok?.access_token ?? null;
  }

  if (!accessToken || !clientId) {
    return NextResponse.json(
      {
        paymentUrl: null,
        message:
          'OwnerRez is not connected for this resort. Complete OAuth in Settings → Integrations (spec §15).',
      },
      { headers: CORS_JSON_HEADERS }
    );
  }

  const arrival = body.Arrival ?? '';
  const departure = body.Departure ?? '';
  if (!arrival || !departure) {
    return NextResponse.json(
      { paymentUrl: null, message: 'Arrival and Departure dates are required for quotes.' },
      { status: 400, headers: CORS_JSON_HEADERS }
    );
  }

  const payload = {
    PropertyId: propertyId,
    Arrival: arrival,
    Departure: departure,
    Adults: body.Adults ?? 2,
    Children: body.Children ?? 0,
    Pets: body.Pets ?? 0,
    GuestId: body.GuestId,
  };

  try {
    const r = await fetch(quotesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': `GeoWaypoint/1.0 (${clientId})`,
      },
      body: JSON.stringify(payload),
    });
    const j = (await r.json()) as { PaymentFormUrl?: string; paymentFormUrl?: string; message?: string };
    if (!r.ok) {
      return NextResponse.json(
        { paymentUrl: null, message: j.message ?? `OwnerRez quotes error (${r.status})` },
        { status: 502, headers: CORS_JSON_HEADERS }
      );
    }
    const paymentUrl = j.PaymentFormUrl ?? j.paymentFormUrl ?? null;
    return NextResponse.json({ paymentUrl, message: paymentUrl ? null : 'No PaymentForm URL in response' }, { headers: CORS_JSON_HEADERS });
  } catch (e) {
    return NextResponse.json(
      { paymentUrl: null, message: e instanceof Error ? e.message : 'Quote request failed' },
      { status: 502, headers: CORS_JSON_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_JSON_HEADERS });
}

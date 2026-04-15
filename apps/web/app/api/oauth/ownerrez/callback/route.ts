import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'gw_or_oauth_state';
const RESORT_COOKIE = 'gw_or_oauth_resort';

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * OwnerRez OAuth redirect handler: exchange `code` for access_token and store on resort.
 * @see https://www.ownerrez.com/support/articles/api-oauth-app
 */
export async function GET(request: NextRequest) {
  const base = appBase();
  const fail = (q: string) => NextResponse.redirect(new URL(`${base}/settings?or=${q}#sp-integrations`));

  const url = request.nextUrl;
  const err = url.searchParams.get('error');
  const errDesc = url.searchParams.get('error_description');
  if (err) {
    const msg = errDesc ? `${err}:${encodeURIComponent(errDesc.slice(0, 120))}` : err;
    return NextResponse.redirect(new URL(`${base}/settings?or=denied&detail=${msg}#sp-integrations`));
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  const resortId = jar.get(RESORT_COOKIE)?.value;

  jar.delete(STATE_COOKIE);
  jar.delete(RESORT_COOKIE);

  if (!code || !state || !expected || state !== expected || !resortId) {
    return fail('state');
  }

  const clientId = process.env.OWNERREZ_CLIENT_ID;
  const clientSecret = process.env.OWNERREZ_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail('config');
  }

  const redirectUri = `${base}/api/oauth/ownerrez/callback`;
  const tokenUrl = 'https://api.ownerrez.com/oauth/access_token';
  const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  let accessToken: string;
  try {
    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    const j = (await r.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!r.ok || !j.access_token) {
      const detail = j.error_description ?? j.error ?? `http_${r.status}`;
      return NextResponse.redirect(
        new URL(`${base}/settings?or=token&detail=${encodeURIComponent(detail)}#sp-integrations`)
      );
    }
    accessToken = j.access_token;
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'fetch_failed';
    return NextResponse.redirect(
      new URL(`${base}/settings?or=token&detail=${encodeURIComponent(detail)}#sp-integrations`)
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('ownerrez_tokens').upsert(
      {
        resort_id: resortId,
        access_token: accessToken,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'resort_id' }
    );
    if (error) {
      return NextResponse.redirect(
        new URL(`${base}/settings?or=db&detail=${encodeURIComponent(error.message)}#sp-integrations`)
      );
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'admin_client';
    return NextResponse.redirect(
      new URL(`${base}/settings?or=db&detail=${encodeURIComponent(detail)}#sp-integrations`)
    );
  }

  return NextResponse.redirect(new URL(`${base}/settings?or=connected#sp-integrations`));
}

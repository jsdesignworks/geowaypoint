import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { planAllowsOwnerRezSync } from '@/lib/plan';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'gw_or_oauth_state';
const RESORT_COOKIE = 'gw_or_oauth_resort';
const COOKIE_MAX_AGE = 600;

/**
 * Starts OwnerRez OAuth (authorization code). User must be logged in and own the resort.
 * @see https://www.ownerrez.com/support/articles/api-oauth-app
 */
export async function GET() {
  const clientId = process.env.OWNERREZ_CLIENT_ID;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = `${appUrl}/api/oauth/ownerrez/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'OWNERREZ_CLIENT_ID is not configured on the server.' },
      { status: 501 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/', appUrl));
  }

  const { data: resort } = await supabase
    .from('resorts')
    .select('id, ownerrez_integration_enabled, plan')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!resort?.id) {
    return NextResponse.redirect(new URL('/settings', appUrl));
  }

  if (!resort.ownerrez_integration_enabled) {
    return NextResponse.redirect(new URL(`${appUrl}/settings?or=disabled#sp-integrations`));
  }

  if (!planAllowsOwnerRezSync(resort.plan)) {
    return NextResponse.redirect(new URL(`${appUrl}/settings?or=plan#sp-integrations`));
  }

  const state =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;

  const scope = (process.env.OWNERREZ_OAUTH_SCOPE ?? '').trim();

  const authUrl = new URL('https://app.ownerrez.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  if (scope) {
    authUrl.searchParams.set('scope', scope);
  }

  const jar = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  jar.set(RESORT_COOKIE, resort.id, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return NextResponse.redirect(authUrl.toString());
}

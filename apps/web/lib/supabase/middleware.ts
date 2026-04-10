import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    return supabaseResponse;
  }

  const meta = user?.user_metadata as { onboarding_complete?: boolean } | undefined;
  const onboardingComplete = meta?.onboarding_complete === true;
  const isOnboarding = path.startsWith('/onboarding');
  const isAuthCallback = path.startsWith('/auth/');

  const protectedPrefixes = [
    '/overview',
    '/maps',
    '/analytics',
    '/embed',
    '/settings',
    '/profile',
    '/loyalty',
    '/editor',
  ];
  const isPublicEmbedData = /^\/embed\/[^/]+\/[0-9a-f-]{36}$/i.test(path);
  const isProtected =
    !isPublicEmbedData &&
    protectedPrefixes.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && isProtected) {
    const u = request.nextUrl.clone();
    u.pathname = '/';
    return NextResponse.redirect(u);
  }

  if (!user && isOnboarding) {
    const u = request.nextUrl.clone();
    u.pathname = '/';
    return NextResponse.redirect(u);
  }

  if (user && onboardingComplete && isOnboarding) {
    const u = request.nextUrl.clone();
    u.pathname = '/overview';
    return NextResponse.redirect(u);
  }

  const isPublicMarketing = path === '/terms' || path === '/privacy' || path === '/join';

  if (!user && isPublicMarketing) {
    return supabaseResponse;
  }

  if (user && (path === '/' || path === '/signup' || path === '/forgot-password')) {
    const u = request.nextUrl.clone();
    u.pathname = onboardingComplete ? '/overview' : '/onboarding';
    return NextResponse.redirect(u);
  }

  if (user && !onboardingComplete && isProtected && !isAuthCallback) {
    const u = request.nextUrl.clone();
    u.pathname = '/onboarding';
    return NextResponse.redirect(u);
  }

  return supabaseResponse;
}

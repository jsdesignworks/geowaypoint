import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Spec §15 — OwnerRez webhook receiver (verify Basic Auth; extend with property→site sync). */
function basicAuthOk(request: Request): boolean {
  const user = process.env.OWNERREZ_WEBHOOK_USER;
  const pass = process.env.OWNERREZ_WEBHOOK_PASSWORD;
  if (!user || !pass) {
    return false;
  }
  const h = request.headers.get('authorization');
  if (!h?.startsWith('Basic ')) {
    return false;
  }
  try {
    const decoded = atob(h.slice(6));
    const i = decoded.indexOf(':');
    const u = decoded.slice(0, i);
    const p = decoded.slice(i + 1);
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!basicAuthOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, stub: true });
}

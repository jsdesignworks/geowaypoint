import { NextResponse } from 'next/server';

/** Spec §18 — uptime monitors (Better Uptime). */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'geowaypoint-web', ts: new Date().toISOString() });
}

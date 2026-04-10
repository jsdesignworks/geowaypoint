import { NextResponse } from 'next/server';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';

export const dynamic = 'force-dynamic';

/** OwnerRez quote / checkout URL — stub until §15 OAuth + quotes are wired. */
export async function POST() {
  return NextResponse.json(
    {
      paymentUrl: null as string | null,
      message: 'Quotes and PaymentForm URLs require OwnerRez integration (spec §15).',
    },
    { headers: CORS_JSON_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_JSON_HEADERS });
}

import { NextResponse } from 'next/server';
import { planAllowsApiAccess, planAllowsOwnerRezSync } from '@/lib/plan';
import { CORS_JSON_HEADERS } from '@/lib/http/cors';

/** Spec §16 — server-side feature gate JSON. */
export function upgradeRequiredResponse(feature: string) {
  return NextResponse.json(
    { error: 'upgrade_required', feature },
    { status: 402, headers: CORS_JSON_HEADERS }
  );
}

export function assertOwnerRezAllowed(plan: string | null | undefined) {
  if (!planAllowsOwnerRezSync(plan)) {
    return upgradeRequiredResponse('ownerrez_sync');
  }
  return null;
}

export function assertApiAccessAllowed(plan: string | null | undefined) {
  if (!planAllowsApiAccess(plan)) {
    return upgradeRequiredResponse('api_access');
  }
  return null;
}

/**
 * Spec §1 / §16 — plan matrix (Starter 1 map, site caps, feature flags).
 * Enforcement: combine with server checks in API routes and actions.
 */

export type PlanId =
  | 'starter'
  | 'trial'
  | 'growth'
  | 'pro'
  | 'resort'
  | 'enterprise';

function norm(plan: string | null | undefined): PlanId {
  const p = (plan ?? 'starter').toLowerCase();
  if (
    p === 'starter' ||
    p === 'trial' ||
    p === 'growth' ||
    p === 'pro' ||
    p === 'resort' ||
    p === 'enterprise'
  ) {
    return p;
  }
  return 'starter';
}

/** Max maps for plan (Starter = 1). Trial matches Pro (unlimited). */
export function maxMapsForPlan(plan: string | null | undefined): number {
  const p = norm(plan);
  if (p === 'starter') {
    return 1;
  }
  return Number.POSITIVE_INFINITY;
}

/** Max sites per single map (§1 matrix). */
export function maxSitesPerMapForPlan(plan: string | null | undefined): number {
  const p = norm(plan);
  switch (p) {
    case 'starter':
      return 30;
    case 'growth':
      return 75;
    case 'trial':
    case 'pro':
      return 150;
    case 'resort':
      return 300;
    case 'enterprise':
      return Number.POSITIVE_INFINITY;
    default:
      return 30;
  }
}

export function planAllowsProFeatures(plan: string | null | undefined) {
  const p = norm(plan);
  return p !== 'starter';
}

export function planAllowsUnlimitedMaps(plan: string | null | undefined) {
  return maxMapsForPlan(plan) === Number.POSITIVE_INFINITY;
}

/** @deprecated use maxMapsForPlan */
export function starterMapLimit() {
  return 1;
}

export function planAllowsOwnerRezSync(plan: string | null | undefined) {
  return norm(plan) !== 'starter';
}

export function planAllowsApiAccess(plan: string | null | undefined) {
  const p = norm(plan);
  return p === 'trial' || p === 'pro' || p === 'resort' || p === 'enterprise';
}

export function planAllowsBrandingRemoval(plan: string | null | undefined) {
  const p = norm(plan);
  return p === 'trial' || p === 'pro' || p === 'resort' || p === 'enterprise';
}

export function planAllowsWhiteLabelEmbed(plan: string | null | undefined) {
  return norm(plan) === 'enterprise';
}

/**
 * Paid tiers should have an active Stripe subscription id on the resort.
 * Used for public embed 402 (subscription_required).
 */
export function planRequiresStripeSubscription(plan: string | null | undefined) {
  const p = norm(plan);
  return p === 'growth' || p === 'pro' || p === 'resort' || p === 'enterprise';
}

export function isTrialExpired(trialEndsAt: string | null | undefined, plan: string | null | undefined) {
  if (norm(plan) !== 'trial' || !trialEndsAt) {
    return false;
  }
  return new Date(trialEndsAt).getTime() < Date.now();
}

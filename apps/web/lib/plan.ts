/** Spec §16 — lightweight plan checks (extend as product rules harden). */
export function planAllowsProFeatures(plan: string | null | undefined) {
  const p = (plan ?? 'starter').toLowerCase();
  return p === 'pro' || p === 'trial';
}

export function planAllowsUnlimitedMaps(plan: string | null | undefined) {
  const p = (plan ?? 'starter').toLowerCase();
  return p === 'pro' || p === 'trial';
}

export function starterMapLimit() {
  return 3;
}

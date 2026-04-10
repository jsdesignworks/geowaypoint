/**
 * Best-effort in-process rate limit for serverless (per instance).
 * Spec hardening for POST /api/v1/events — replace with Redis/Upstash in production.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

export function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  if (b.count >= MAX_PER_WINDOW) {
    return false;
  }
  b.count += 1;
  if (buckets.size > 50_000) {
    buckets.clear();
  }
  return true;
}

export function clientIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    return xf.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Stable guest session for analytics (embed + PublicGuestMapView).
 * Persists for the browser tab/session via sessionStorage.
 */

const PREFIX = 'gw_embed_sess_v1:';

function storageKey(resortSlug: string, mapId: string) {
  return `${PREFIX}${resortSlug}:${mapId}`;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `gw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getGuestEmbedSessionId(resortSlug: string, mapId: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const key = storageKey(resortSlug, mapId);
  try {
    const existing = sessionStorage.getItem(key);
    if (existing && existing.length >= 8 && existing.length <= 80) {
      return existing;
    }
    const id = randomId();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
}

/** Monotonic per (slug, map) for ordering events in a session. */
export function nextGuestEmbedClientSeq(resortSlug: string, mapId: string): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const key = `${storageKey(resortSlug, mapId)}:seq`;
  try {
    const raw = sessionStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    const next = Number.isFinite(n) ? n + 1 : 1;
    sessionStorage.setItem(key, String(next));
    return next;
  } catch {
    return Date.now() % 1_000_000_000;
  }
}

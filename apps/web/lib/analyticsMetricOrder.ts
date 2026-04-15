const STORAGE_KEY = 'gw_analytics_metric_order_v1';

/** Stable ids for analytics summary tiles (drag reorder). */
export const ANALYTICS_METRIC_IDS = [
  'map_views',
  'site_clicks',
  'book_clicks',
  'click_to_book',
  'unique_sessions',
  'avg_events_session',
  'sessions_book',
] as const;

export type AnalyticsMetricId = (typeof ANALYTICS_METRIC_IDS)[number];

const DEFAULT_ORDER: AnalyticsMetricId[] = [...ANALYTICS_METRIC_IDS];

function isMetricId(s: string): s is AnalyticsMetricId {
  return (ANALYTICS_METRIC_IDS as readonly string[]).includes(s);
}

export function loadAnalyticsMetricOrder(): AnalyticsMetricId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ORDER;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_ORDER;
    }
    const seen = new Set<string>();
    const next: AnalyticsMetricId[] = [];
    for (const x of parsed) {
      if (typeof x === 'string' && isMetricId(x) && !seen.has(x)) {
        seen.add(x);
        next.push(x);
      }
    }
    for (const id of DEFAULT_ORDER) {
      if (!seen.has(id)) {
        next.push(id);
      }
    }
    return next;
  } catch {
    return DEFAULT_ORDER;
  }
}

export function saveAnalyticsMetricOrder(order: AnalyticsMetricId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

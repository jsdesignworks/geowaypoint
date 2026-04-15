export type AnalyticsPersistV1 = {
  v: 1;
  from: string;
  to: string;
  mapId: string;
  filtersOpen: boolean;
  allTime: boolean;
  /** Last preset applied, or custom when dates edited manually / via calendar */
  preset: 'custom' | '7' | '14' | '30' | '90' | 'ytd';
};

const key = (resortId: string) => `gw_analytics_v1:${resortId}`;

export function loadAnalyticsFilters(resortId: string): Partial<AnalyticsPersistV1> | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(key(resortId));
    if (!raw) {
      return null;
    }
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== 'object') {
      return null;
    }
    const o = j as Record<string, unknown>;
    if (o.v !== 1) {
      return null;
    }
    return {
      v: 1,
      from: typeof o.from === 'string' ? o.from : undefined,
      to: typeof o.to === 'string' ? o.to : undefined,
      mapId: typeof o.mapId === 'string' ? o.mapId : undefined,
      filtersOpen: typeof o.filtersOpen === 'boolean' ? o.filtersOpen : undefined,
      allTime: typeof o.allTime === 'boolean' ? o.allTime : undefined,
      preset:
        o.preset === 'custom' ||
        o.preset === '7' ||
        o.preset === '14' ||
        o.preset === '30' ||
        o.preset === '90' ||
        o.preset === 'ytd'
          ? o.preset
          : undefined,
    };
  } catch {
    return null;
  }
}

export function saveAnalyticsFilters(resortId: string, data: AnalyticsPersistV1) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key(resortId), JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

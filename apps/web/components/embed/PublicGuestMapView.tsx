'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hotspotColorForStatus, STATUS_HOTSPOT_COLORS } from '@/lib/constants/hspot';
import { defaultStayDates } from '@/lib/embed/defaultStayDates';
import { siteDisplayCode } from '@/lib/embed/siteDisplayCode';
import { getGuestEmbedSessionId, nextGuestEmbedClientSeq } from '@/lib/embed/guestEmbedSession';
import { toast } from '@/lib/toast';

export type PublicGuestSite = {
  id: string;
  name: string;
  display_code?: string | null;
  site_type?: string | null;
  status?: string | null;
  rate_night?: number | null;
  max_length_ft?: number | null;
  description?: string | null;
  photo_url?: string | null;
  pos_x?: number | string | null;
  pos_y?: number | string | null;
  ownerrez_property_id?: string | null;
};

export type PublicGuestEmbedData = {
  resort: { slug: string; name: string };
  map: {
    id: string;
    name: string;
    image_url: string | null;
    guest_site_detail_mode: 'popup' | 'sidebar';
  };
  sites: PublicGuestSite[];
};

const MAX_COMPARE = 4;

function numPct(v: number | string | null | undefined, fallback: number) {
  if (v === null || v === undefined) {
    return fallback;
  }
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}

const STATUS_KEYS = ['available', 'occupied', 'reserved', 'maintenance'] as const;

function amenityTags(description: string | null | undefined): string[] {
  const d = description?.trim();
  if (!d || !d.includes(',')) {
    return [];
  }
  return d
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 48)
    .slice(0, 12);
}

function proseDescription(description: string | null | undefined, hasTags: boolean): string | null {
  const d = description?.trim();
  if (!d) {
    return null;
  }
  if (hasTags) {
    return null;
  }
  return d;
}

/** Guest map: full page at `/embed/...` or embedded inside the admin preview modal. */
export function PublicGuestMapView({
  data,
  layout = 'page',
  onClose,
}: {
  data: PublicGuestEmbedData;
  layout?: 'page' | 'embedded';
  onClose?: () => void;
}) {
  const { map: m, sites: ss, resort } = data;
  const detailMode = m.guest_site_detail_mode === 'sidebar' ? 'sidebar' : 'popup';

  const [pop, setPop] = useState<PublicGuestSite | null>(null);
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null);
  const [sidebarSite, setSidebarSite] = useState<PublicGuestSite | null>(null);
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareExpanded, setCompareExpanded] = useState(false);
  const [bookingSiteId, setBookingSiteId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const emitGuestEvent = useCallback(
    (event: string, site_id: string | null) => {
      const session_id = getGuestEmbedSessionId(resort.slug, m.id);
      const client_seq = nextGuestEmbedClientSeq(resort.slug, m.id);
      void fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          resort_slug: resort.slug,
          map_id: m.id,
          site_id,
          session_id,
          client_seq,
        }),
      }).catch(() => {});
    },
    [resort.slug, m.id]
  );

  useEffect(() => {
    emitGuestEvent('map_view', null);
  }, [emitGuestEvent]);

  useEffect(() => {
    if (!compareExpanded) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCompareExpanded(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareExpanded]);

  const active = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const totalSites = ss.length;
  const availableSites = useMemo(
    () => ss.filter((s) => (s.status ?? 'available').toLowerCase() === 'available').length,
    [ss]
  );

  function vis(s: PublicGuestSite) {
    const st = (s.status ?? 'available').toLowerCase();
    if (!active) {
      return true;
    }
    return filters[st] === true;
  }

  function closePopup() {
    setPop(null);
    setPopPos(null);
  }

  function openFloatingPopup(e: React.MouseEvent, s: PublicGuestSite) {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const r = stage.getBoundingClientRect();
    setSidebarSite(null);
    setPop(s);
    setPopPos({
      left: Math.min(e.clientX - r.left + 10, r.width - 220),
      top: Math.min(e.clientY - r.top + 10, r.height - 40),
    });
    emitGuestEvent('marker_click', s.id);
  }

  function toggleCompareId(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, id];
    });
  }

  function handleMarkerClick(e: React.MouseEvent, s: PublicGuestSite, _index: number) {
    e.stopPropagation();
    e.preventDefault();
    const useCompare = compareMode || e.shiftKey;
    if (useCompare) {
      closePopup();
      setSidebarSite(null);
      toggleCompareId(s.id);
      return;
    }
    if (detailMode === 'sidebar') {
      closePopup();
      setSidebarSite(s);
      emitGuestEvent('marker_click', s.id);
      return;
    }
    openFloatingPopup(e, s);
  }

  const bookThisSite = useCallback(
    async (site: PublicGuestSite) => {
      setBookingSiteId(site.id);
      try {
        emitGuestEvent('book_click', site.id);

        const dates = defaultStayDates();
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resort_slug: resort.slug,
            map_id: m.id,
            site_id: site.id,
            PropertyId: site.ownerrez_property_id,
            Arrival: dates.Arrival,
            Departure: dates.Departure,
            Adults: 2,
            Children: 0,
            Pets: 0,
          }),
        });
        const j = (await res.json()) as { paymentUrl?: string | null; message?: string };
        if (j.paymentUrl) {
          window.location.href = j.paymentUrl;
          return;
        }
        toast(j.message ?? 'Booking is not available yet.', 'error');
      } catch {
        toast('Booking request failed.', 'error');
      } finally {
        setBookingSiteId(null);
      }
    },
    [m.id, resort.slug, emitGuestEvent]
  );

  const rootStyle =
    layout === 'embedded'
      ? {
          margin: 0,
          minHeight: 0,
          flex: 1,
          display: 'flex' as const,
          flexDirection: 'column' as const,
          background: '#f6faf7' as const,
          overflow: 'hidden' as const,
        }
      : {
          margin: 0,
          minHeight: '100vh',
          display: 'flex' as const,
          flexDirection: 'column' as const,
          background: '#f6faf7' as const,
        };

  function renderSiteDetail(site: PublicGuestSite, siteIndex: number, onCloseDetail: () => void) {
    const tags = amenityTags(site.description);
    const prose = proseDescription(site.description, tags.length > 0);
    const st = (site.status ?? 'available').toLowerCase();
    const booking = bookingSiteId === site.id;
    return (
      <>
        <div className="gw-site-popup-head">
          <div>
            <div className="gw-site-popup-code font-serif-heading" style={{ fontWeight: 500 }}>
              {siteDisplayCode({
                display_code: site.display_code,
                name: site.name,
                index: siteIndex,
              })}
            </div>
            <div className="gw-site-popup-title">{site.name}</div>
          </div>
          <button type="button" className="gw-site-popup-x" aria-label="Close" onClick={onCloseDetail}>
            ×
          </button>
        </div>
        <span className="gw-site-popup-status" data-status={st}>
          {st}
        </span>
        {site.site_type ? (
          <div className="gw-site-popup-row">
            <span className="gw-site-popup-k">Type</span>
            <span>{site.site_type}</span>
          </div>
        ) : null}
        {site.max_length_ft != null ? (
          <div className="gw-site-popup-row">
            <span className="gw-site-popup-k">Max length</span>
            <span>{Number(site.max_length_ft)} ft</span>
          </div>
        ) : null}
        {site.rate_night != null ? (
          <div className="gw-site-popup-row">
            <span className="gw-site-popup-k">Nightly rate</span>
            <span>${Number(site.rate_night)} / night</span>
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div className="gw-site-popup-tags" aria-label="Features">
            {tags.map((t) => (
              <span key={t} className="gw-site-popup-tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {prose ? <p className="gw-site-popup-desc">{prose}</p> : null}
        <div className="gw-site-popup-actions">
          <button
            type="button"
            className="btn btn-primary gw-site-popup-book"
            disabled={booking}
            onClick={() => void bookThisSite(site)}
          >
            {booking ? 'Booking…' : 'Book this site'}
          </button>
        </div>
      </>
    );
  }

  const compareSites = compareIds
    .map((id) => ss.find((x) => x.id === id))
    .filter((x): x is PublicGuestSite => x != null);

  return (
    <div className="gw-public-embed-root" style={rootStyle}>
      <header className="gw-embed-header">
        <div className="gw-embed-header-inner">
          <h2 className="gw-embed-resort-title">{resort.name}</h2>
          <div className="gw-embed-filter-group">
            {STATUS_KEYS.map((st) => (
              <button
                key={st}
                type="button"
                className={`gw-embed-filter-btn${filters[st] ? ' is-on' : ''}`}
                onClick={() => setFilters((f) => ({ ...f, [st]: !f[st] }))}
              >
                <span
                  className="gw-embed-filter-dot"
                  style={{ background: STATUS_HOTSPOT_COLORS[st] ?? '#fff' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{st === 'maintenance' ? 'Maint' : st}</span>
              </button>
            ))}
            {active ? (
              <button type="button" className="gw-embed-filter-clear" onClick={() => setFilters({})}>
                Clear
              </button>
            ) : null}
            <button
              type="button"
              className={`gw-embed-filter-btn${compareMode ? ' is-on' : ''}`}
              aria-pressed={compareMode}
              onClick={() => {
                setCompareMode((c) => !c);
                if (compareMode) {
                  setCompareIds([]);
                  setCompareExpanded(false);
                }
                closePopup();
                setSidebarSite(null);
              }}
            >
              Compare
            </button>
          </div>
          {onClose ? (
            <button type="button" className="gw-embed-close" aria-label="Close preview" onClick={onClose}>
              ×
            </button>
          ) : null}
        </div>
      </header>

      <div className="gw-embed-main-row">
        <div className="gw-embed-main-col">
          <div className="gw-embed-map-wrap">
            <div
              ref={stageRef}
              className="map-stage gw-embed-stage"
              onMouseDown={(e) => {
                const t = e.target as HTMLElement;
                if (t === e.currentTarget || t.tagName === 'IMG') {
                  closePopup();
                  setSidebarSite(null);
                }
              }}
            >
              {m.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image_url} alt={m.name || 'Resort map'} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
              ) : (
                <div
                  style={{
                    width: 'min(560px, 100%)',
                    height: 280,
                    background: '#e8ede9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5a6b5f',
                    fontSize: 14,
                  }}
                >
                  No map image
                </div>
              )}
              {ss.map((s, i) =>
                vis(s) ? (
                  <button
                    key={s.id}
                    type="button"
                    className={`gw-site-marker${compareIds.includes(s.id) ? ' is-compare-sel' : ''}`}
                    style={{
                      left: `${numPct(s.pos_x, 50)}%`,
                      top: `${numPct(s.pos_y, 50)}%`,
                      background: hotspotColorForStatus(s.status, i),
                    }}
                    aria-label={`${siteDisplayCode({ display_code: s.display_code, name: s.name, index: i })} ${s.name}`}
                    aria-pressed={compareIds.includes(s.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleMarkerClick(e, s, i)}
                  >
                    <span className="gw-site-marker-label">
                      {siteDisplayCode({ display_code: s.display_code, name: s.name, index: i })}
                    </span>
                  </button>
                ) : null
              )}
              {detailMode === 'popup' && pop && popPos ? (
                <div
                  className="gw-site-popup"
                  role="dialog"
                  aria-label="Site details"
                  style={{ left: popPos.left, top: popPos.top }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {renderSiteDetail(pop, ss.findIndex((x) => x.id === pop.id), closePopup)}
                </div>
              ) : null}
            </div>
          </div>

          <footer className="gw-embed-footer">
            <span className="gw-embed-footer-count">
              {availableSites} of {totalSites} sites available
            </span>
            <span className="gw-embed-footer-brand">Powered by GeoWaypoint</span>
          </footer>
        </div>

        {detailMode === 'sidebar' && sidebarSite ? (
          <aside className="gw-embed-sidebar" aria-label="Site details">
            <div className="gw-site-popup gw-site-popup--sidebar" role="dialog">
              {renderSiteDetail(sidebarSite, ss.findIndex((x) => x.id === sidebarSite.id), () =>
                setSidebarSite(null)
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {compareIds.length > 0 ? (
        <div className="gw-embed-compare-bar" role="region" aria-label="Compare sites">
          <span className="gw-embed-compare-count">
            {compareIds.length} site{compareIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="gw-embed-compare-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setCompareIds([]);
                setCompareExpanded(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary"
              id="gw-guest-compare-toggle"
              aria-expanded={compareExpanded}
              aria-controls="gw-guest-compare-panel"
              onClick={() => setCompareExpanded((x) => !x)}
            >
              {compareExpanded ? 'Hide compare' : 'Compare'}
            </button>
          </div>
        </div>
      ) : null}

      {compareExpanded && compareSites.length > 0 ? (
        <div
          id="gw-guest-compare-panel"
          className="gw-embed-compare-panel"
          role="region"
          aria-label="Side by side comparison"
        >
          <div className="gw-embed-compare-grid">
            {compareSites.map((s) => {
              const i = ss.findIndex((x) => x.id === s.id);
              const tags = amenityTags(s.description);
              return (
                <div key={s.id} className="gw-embed-compare-card">
                  <div className="gw-embed-compare-card-title">
                    {siteDisplayCode({ display_code: s.display_code, name: s.name, index: i })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>{s.name}</div>
                  <div className="gw-site-popup-row">
                    <span className="gw-site-popup-k">Status</span>
                    <span>{(s.status ?? 'available').toLowerCase()}</span>
                  </div>
                  {s.site_type ? (
                    <div className="gw-site-popup-row">
                      <span className="gw-site-popup-k">Type</span>
                      <span>{s.site_type}</span>
                    </div>
                  ) : null}
                  {s.max_length_ft != null ? (
                    <div className="gw-site-popup-row">
                      <span className="gw-site-popup-k">Max length</span>
                      <span>{Number(s.max_length_ft)} ft</span>
                    </div>
                  ) : null}
                  {s.rate_night != null ? (
                    <div className="gw-site-popup-row">
                      <span className="gw-site-popup-k">Nightly</span>
                      <span>${Number(s.rate_night)}</span>
                    </div>
                  ) : null}
                  {tags.length > 0 ? (
                    <div className="gw-site-popup-tags" style={{ marginTop: 8 }}>
                      {tags.map((t) => (
                        <span key={t} className="gw-site-popup-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

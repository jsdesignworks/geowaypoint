'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { planAllowsProFeatures } from '@/lib/plan';
import { UpgradeGateModal } from '@/components/billing/UpgradeGateModal';
import { loadAnalyticsFilters, saveAnalyticsFilters, type AnalyticsPersistV1 } from '@/lib/analyticsFilterPersist';
import {
  ANALYTICS_METRIC_IDS,
  loadAnalyticsMetricOrder,
  saveAnalyticsMetricOrder,
  type AnalyticsMetricId,
} from '@/lib/analyticsMetricOrder';

export type EventRow = {
  id: string;
  resort_id: string;
  map_id: string;
  site_id: string | null;
  event: string;
  created_at: string;
  session_id?: string | null;
  client_seq?: number | null;
};

type MapOpt = { id: string; name: string };

function markerClickCount(e: EventRow) {
  return e.event === 'marker_click' || e.event === 'site_click';
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function SortableMetricCard({
  id,
  label,
  value,
}: {
  id: AnalyticsMetricId;
  label: string;
  value: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    touchAction: 'none' as const,
  };
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, padding: 14 }}
      className="card gw-analytics-metric-tile"
      {...attributes}
      {...listeners}
      title="Drag to reorder metrics"
    >
      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{label}</div>
      <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function SortableSummaryTiles({
  tiles,
}: {
  tiles: Record<AnalyticsMetricId, { label: string; value: string }>;
}) {
  const [order, setOrder] = useState<AnalyticsMetricId[]>(() => [...ANALYTICS_METRIC_IDS]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOrder(loadAnalyticsMetricOrder());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      saveAnalyticsMetricOrder(order);
    }
  }, [order, ready]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setOrder((items) => {
      const oldIndex = items.indexOf(active.id as AnalyticsMetricId);
      const newIndex = items.indexOf(over.id as AnalyticsMetricId);
      if (oldIndex < 0 || newIndex < 0) {
        return items;
      }
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {order.map((id) => (
            <SortableMetricCard key={id} id={id} label={tiles[id].label} value={tiles[id].value} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function AnalyticsClient({
  initialEvents,
  maps,
  plan,
  resortId,
}: {
  initialEvents: EventRow[];
  maps: MapOpt[];
  plan: string;
  resortId: string;
}) {
  const def = defaultRange();
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  const [mapId, setMapId] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [allTime, setAllTime] = useState(false);
  const [preset, setPreset] = useState<AnalyticsPersistV1['preset']>('30');
  const [hydrated, setHydrated] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [dayPickerMonths, setDayPickerMonths] = useState(2);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      setDayPickerMonths(typeof window !== 'undefined' && window.innerWidth < 720 ? 1 : 2);
    }
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (allTime) {
      setCalendarOpen(false);
    }
  }, [allTime]);

  useEffect(() => {
    if (!calendarOpen) {
      return;
    }
    function onDoc(e: MouseEvent) {
      const el = calendarWrapRef.current;
      if (!el || !(e.target instanceof Node) || el.contains(e.target)) {
        return;
      }
      setCalendarOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [calendarOpen]);

  const gated = !planAllowsProFeatures(plan);
  const eventsForUi = useMemo(() => (gated ? [] : initialEvents), [gated, initialEvents]);

  useEffect(() => {
    const p = loadAnalyticsFilters(resortId);
    if (p) {
      if (p.from) {
        setFrom(p.from);
      }
      if (p.to) {
        setTo(p.to);
      }
      if (p.mapId !== undefined) {
        setMapId(p.mapId);
      }
      if (typeof p.filtersOpen === 'boolean') {
        setFiltersOpen(p.filtersOpen);
      }
      if (typeof p.allTime === 'boolean') {
        setAllTime(p.allTime);
      }
      if (p.preset) {
        setPreset(p.preset);
      }
    }
    setHydrated(true);
  }, [resortId]);

  useEffect(() => {
    if (!hydrated || gated) {
      return;
    }
    const payload: AnalyticsPersistV1 = {
      v: 1,
      from,
      to,
      mapId,
      filtersOpen,
      allTime,
      preset,
    };
    saveAnalyticsFilters(resortId, payload);
  }, [hydrated, gated, resortId, from, to, mapId, filtersOpen, allTime, preset]);

  const applyPreset = useCallback((p: '7' | '14' | '30' | '90' | 'ytd') => {
    const end = new Date();
    const start = new Date();
    if (p === '7') {
      start.setDate(end.getDate() - 7);
    } else if (p === '14') {
      start.setDate(end.getDate() - 14);
    } else if (p === '30') {
      start.setDate(end.getDate() - 30);
    } else if (p === '90') {
      start.setDate(end.getDate() - 90);
    } else {
      start.setMonth(0, 1);
    }
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
    setPreset(p);
    setAllTime(false);
  }, []);

  const rangeSelected = useMemo((): DateRange | undefined => {
    if (allTime) {
      return undefined;
    }
    try {
      const a = parseISO(from);
      const b = parseISO(to);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        return undefined;
      }
      return { from: a, to: b };
    } catch {
      return undefined;
    }
  }, [from, to, allTime]);

  const filtered = useMemo(() => {
    return eventsForUi.filter((e) => {
      if (mapId && e.map_id !== mapId) {
        return false;
      }
      if (allTime) {
        return true;
      }
      const t0 = new Date(from).getTime();
      const t1 = new Date(to).getTime() + 86400000;
      const t = new Date(e.created_at).getTime();
      if (t < t0 || t > t1) {
        return false;
      }
      return true;
    });
  }, [eventsForUi, from, to, mapId, allTime]);

  const mapViews = useMemo(() => filtered.filter((e) => e.event === 'map_view').length, [filtered]);
  const markerClicks = useMemo(() => filtered.filter(markerClickCount).length, [filtered]);
  const bookClicks = useMemo(() => filtered.filter((e) => e.event === 'book_click').length, [filtered]);
  const clickToBook = useMemo(() => {
    if (markerClicks === 0) {
      return 0;
    }
    return Math.round((bookClicks / markerClicks) * 1000) / 10;
  }, [markerClicks, bookClicks]);

  const uniqueSessions = useMemo(() => {
    const s = new Set<string>();
    for (const e of filtered) {
      if (e.session_id) {
        s.add(e.session_id);
      }
    }
    return s.size;
  }, [filtered]);

  const eventsWithSession = useMemo(() => filtered.filter((e) => !!e.session_id).length, [filtered]);

  const avgEventsPerSession = useMemo(() => {
    if (uniqueSessions === 0) {
      return 0;
    }
    return Math.round((eventsWithSession / uniqueSessions) * 10) / 10;
  }, [eventsWithSession, uniqueSessions]);

  const sessionsWithBooking = useMemo(() => {
    const withBook = new Set<string>();
    for (const e of filtered) {
      if (e.session_id && e.event === 'book_click') {
        withBook.add(e.session_id);
      }
    }
    return withBook.size;
  }, [filtered]);

  const dailyBuckets = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      if (!markerClickCount(e) && e.event !== 'book_click') {
        continue;
      }
      const day = e.created_at.slice(0, 10);
      m.set(day, (m.get(day) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const topSites = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      if (!markerClickCount(e) || !e.site_id) {
        continue;
      }
      m.set(e.site_id, (m.get(e.site_id) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filtered]);

  const maxDay = useMemo(() => Math.max(1, ...dailyBuckets.map(([, n]) => n)), [dailyBuckets]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      m.set(e.event, (m.get(e.event) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const sessionGroups = useMemo(() => {
    const by = new Map<string, EventRow[]>();
    for (const e of filtered) {
      if (!e.session_id) {
        continue;
      }
      const arr = by.get(e.session_id) ?? [];
      arr.push(e);
      by.set(e.session_id, arr);
    }
    return Array.from(by.entries())
      .map(([id, ev]) => ({
        id,
        ev: [...ev].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }))
      .sort(
        (a, b) =>
          new Date(b.ev[b.ev.length - 1]!.created_at).getTime() -
          new Date(a.ev[a.ev.length - 1]!.created_at).getTime()
      )
      .slice(0, 80);
  }, [filtered]);

  function csv() {
    if (gated) {
      return;
    }
    const rows = [['created_at', 'event', 'map_id', 'site_id', 'session_id', 'client_seq'].join(',')];
    for (const e of filtered) {
      rows.push(
        [e.created_at, e.event, e.map_id, e.site_id ?? '', e.session_id ?? '', e.client_seq ?? ''].map((c) =>
          `"${String(c).replace(/"/g, '""')}"`
        ).join(',')
      );
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geowaypoint-events.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function toggleSessionExpand(id: string) {
    setExpandedSessions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const summaryTiles = useMemo(
    (): Record<AnalyticsMetricId, { label: string; value: string }> => ({
      map_views: { label: 'Map views', value: String(mapViews) },
      site_clicks: { label: 'Site clicks', value: String(markerClicks) },
      book_clicks: { label: 'Book clicks', value: String(bookClicks) },
      click_to_book: { label: 'Click-to-book %', value: `${clickToBook}%` },
      unique_sessions: { label: 'Unique sessions', value: String(uniqueSessions) },
      avg_events_session: { label: 'Avg events / session', value: String(avgEventsPerSession) },
      sessions_book: { label: 'Sessions w/ book click', value: String(sessionsWithBooking) },
    }),
    [
      mapViews,
      markerClicks,
      bookClicks,
      clickToBook,
      uniqueSessions,
      avgEventsPerSession,
      sessionsWithBooking,
    ]
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <UpgradeGateModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="analytics"
        title="Analytics is a paid feature"
        body="Upgrade from Starter to Growth or higher to record analytics history, export CSV, and unlock full reporting."
      />
      {gated ? (
        <div
          className="trial-banner"
          style={{
            borderRadius: 'var(--r12)',
            border: '1px solid var(--border)',
            margin: 0,
          }}
        >
          <span>
            <strong>Starter plan:</strong> you can explore the analytics layout below. Upgrade to Growth or higher to
            collect and export real event data.
          </span>
          <Button variant="primary" style={{ padding: '6px 14px' }} onClick={() => setUpgradeOpen(true)}>
            View plans
          </Button>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="rf-input"
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '14px 16px',
            border: 'none',
            borderBottom: filtersOpen ? '1px solid var(--border)' : 'none',
            background: 'var(--white)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Filters &amp; date range</span>
          <span style={{ color: 'var(--ink3)', fontSize: 12 }}>{filtersOpen ? 'Hide' : 'Show'}</span>
        </button>
        {filtersOpen ? (
          <div style={{ padding: 16, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Quick range</label>
                <select
                  className="rf-input"
                  style={{ minWidth: 200 }}
                  value={allTime ? 'all' : preset}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'all') {
                      setAllTime(true);
                      setPreset('custom');
                      return;
                    }
                    setAllTime(false);
                    if (v === 'custom') {
                      setPreset('custom');
                      return;
                    }
                    applyPreset(v as '7' | '14' | '30' | '90' | 'ytd');
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="ytd">Year to date</option>
                  <option value="custom">Custom (use calendar / dates)</option>
                  <option value="all">All time (no date filter)</option>
                </select>
              </div>
              <div ref={calendarWrapRef} style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>From</label>
                  <Input
                    type="date"
                    value={from}
                    disabled={allTime}
                    onFocus={() => {
                      if (!allTime) {
                        setCalendarOpen(true);
                      }
                    }}
                    onClick={() => {
                      if (!allTime) {
                        setCalendarOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setPreset('custom');
                      setAllTime(false);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>To</label>
                  <Input
                    type="date"
                    value={to}
                    disabled={allTime}
                    onFocus={() => {
                      if (!allTime) {
                        setCalendarOpen(true);
                      }
                    }}
                    onClick={() => {
                      if (!allTime) {
                        setCalendarOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setPreset('custom');
                      setAllTime(false);
                    }}
                  />
                </div>
                {calendarOpen && !allTime ? (
                  <div
                    className="gw-analytics-calendar-popover card"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: 8,
                      zIndex: 40,
                      padding: 14,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                      border: '1px solid var(--border)',
                      maxWidth: 'min(100vw - 32px, 720px)',
                    }}
                    role="dialog"
                    aria-label="Date range calendar"
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--ink2)' }}>
                      Calendar range (drag or tap start and end)
                    </div>
                    <DayPicker
                      mode="range"
                      numberOfMonths={dayPickerMonths}
                      selected={rangeSelected}
                      onSelect={(r) => {
                        if (!r?.from) {
                          return;
                        }
                        setFrom(format(r.from, 'yyyy-MM-dd'));
                        if (r.to) {
                          setTo(format(r.to, 'yyyy-MM-dd'));
                        } else {
                          setTo(format(r.from, 'yyyy-MM-dd'));
                        }
                        setPreset('custom');
                        setAllTime(false);
                      }}
                      styles={{
                        root: { fontFamily: 'var(--font-ui, system-ui, sans-serif)' },
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Map (published)
                </label>
                <select
                  className="rf-input"
                  value={mapId}
                  onChange={(e) => setMapId(e.target.value)}
                  style={{ minWidth: 180 }}
                >
                  <option value="">All maps</option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" disabled={gated} onClick={() => csv()}>
                Export CSV
              </Button>
            </div>
            {allTime ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink3)' }}>
                Showing all recorded events for this resort (map filter still applies). Turn off &quot;All time&quot;
                to constrain by date.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink3)' }}>
                Focus <strong>From</strong> or <strong>To</strong> to open the calendar. Click outside or press Escape
                to close.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <SortableSummaryTiles tiles={summaryTiles} />

      <div className="card" style={{ padding: 16 }}>
        <h3 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Daily site &amp; book activity
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, paddingTop: 8 }}>
          {dailyBuckets.length === 0 ? (
            <span style={{ color: 'var(--ink3)', fontSize: 13 }}>No click events in range.</span>
          ) : (
            dailyBuckets.map(([day, n]) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 24,
                    height: `${Math.max(4, (n / maxDay) * 100)}px`,
                    background: 'var(--canopy)',
                    borderRadius: 4,
                  }}
                  title={`${day}: ${n}`}
                />
                <span style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 4, transform: 'rotate(-45deg)' }}>
                  {day.slice(5)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Top sites (site clicks)
        </h3>
        {topSites.length === 0 ? (
          <p style={{ color: 'var(--ink3)', fontSize: 14 }}>No per-site clicks in range.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {topSites.map(([sid, n]) => (
              <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: 'var(--fog)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(n / topSites[0]![1]) * 100}%`,
                      height: '100%',
                      background: 'var(--sky)',
                    }}
                  />
                </div>
                <span style={{ width: 200, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden' }}>{sid}</span>
                <span style={{ width: 32, textAlign: 'right', fontWeight: 600 }}>{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Events by type
        </h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {byType.length === 0 ? (
            <p style={{ color: 'var(--ink3)', fontSize: 14 }}>No events in this range.</p>
          ) : (
            byType.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: 'var(--fog)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${filtered.length ? Math.min(100, (count / filtered.length) * 100) : 0}%`,
                      height: '100%',
                      background: 'var(--canopy)',
                    }}
                  />
                </div>
                <span style={{ width: 120, fontSize: 13 }}>{name}</span>
                <span style={{ width: 40, textAlign: 'right', fontWeight: 600 }}>{count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Sessions &amp; click path
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Events grouped by guest <code>session_id</code> (new embeds and preview send this). Older rows may have no
          session.
        </p>
        {sessionGroups.length === 0 ? (
          <p style={{ color: 'var(--ink3)', fontSize: 14 }}>No session-tagged events in this range.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {sessionGroups.map(({ id, ev }) => {
              const open = !!expandedSessions[id];
              const last = ev[ev.length - 1]!;
              const first = ev[0]!;
              const hasBook = ev.some((x) => x.event === 'book_click');
              return (
                <div
                  key={id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r8)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSessionExpand(id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'var(--fog)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }} title={id}>
                      {id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                      {ev.length} event{ev.length === 1 ? '' : 's'}
                      {hasBook ? ' · booked' : ''}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {first.created_at.slice(0, 19)} → {last.created_at.slice(0, 19)}
                    </span>
                  </button>
                  {open ? (
                    <ol style={{ margin: 0, padding: '12px 12px 12px 28px', fontSize: 13, lineHeight: 1.6 }}>
                      {ev.map((e) => (
                        <li key={e.id}>
                          <strong>{e.event}</strong>
                          {e.site_id ? (
                            <span style={{ color: 'var(--ink3)' }}> · site {e.site_id.slice(0, 8)}…</span>
                          ) : null}
                          <span style={{ color: 'var(--ink3)' }}> · {e.created_at.slice(0, 19)}</span>
                          {e.client_seq != null ? (
                            <span style={{ color: 'var(--ink3)' }}> · seq {e.client_seq}</span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

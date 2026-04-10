'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { planAllowsProFeatures } from '@/lib/plan';
import { UpgradeGateModal } from '@/components/billing/UpgradeGateModal';

type EventRow = {
  id: string;
  resort_id: string;
  map_id: string;
  site_id: string | null;
  event: string;
  created_at: string;
};

type MapOpt = { id: string; name: string };

function markerClickCount(e: EventRow) {
  return e.event === 'marker_click' || e.event === 'site_click';
}

export function AnalyticsClient({
  initialEvents,
  maps,
  plan,
}: {
  initialEvents: EventRow[];
  maps: MapOpt[];
  plan: string;
}) {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [mapId, setMapId] = useState<string>('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const gated = !planAllowsProFeatures(plan);
  const eventsForUi = useMemo(() => (gated ? [] : initialEvents), [gated, initialEvents]);

  function applyPreset(preset: '7' | '14' | '30' | '90' | 'ytd') {
    const end = new Date();
    const start = new Date();
    if (preset === '7') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '14') {
      start.setDate(end.getDate() - 14);
    } else if (preset === '30') {
      start.setDate(end.getDate() - 30);
    } else if (preset === '90') {
      start.setDate(end.getDate() - 90);
    } else {
      start.setMonth(0, 1);
    }
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
  }

  const filtered = useMemo(() => {
    const t0 = new Date(from).getTime();
    const t1 = new Date(to).getTime() + 86400000;
    return eventsForUi.filter((e) => {
      const t = new Date(e.created_at).getTime();
      if (t < t0 || t > t1) {
        return false;
      }
      if (mapId && e.map_id !== mapId) {
        return false;
      }
      return true;
    });
  }, [eventsForUi, from, to, mapId]);

  const mapViews = useMemo(() => filtered.filter((e) => e.event === 'map_view').length, [filtered]);
  const markerClicks = useMemo(() => filtered.filter(markerClickCount).length, [filtered]);
  const bookClicks = useMemo(() => filtered.filter((e) => e.event === 'book_click').length, [filtered]);
  const clickToBook = useMemo(() => {
    if (markerClicks === 0) {
      return 0;
    }
    return Math.round((bookClicks / markerClicks) * 1000) / 10;
  }, [markerClicks, bookClicks]);

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

  function csv() {
    if (gated) return;
    const rows = [['created_at', 'event', 'map_id', 'site_id'].join(',')];
    for (const e of filtered) {
      rows.push(
        [e.created_at, e.event, e.map_id, e.site_id ?? ''].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
      );
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geowaypoint-events.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
      <div className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="outline" onClick={() => applyPreset('7')}>
            Last 7 days
          </Button>
          <Button variant="outline" onClick={() => applyPreset('14')}>
            Last 14 days
          </Button>
          <Button variant="outline" onClick={() => applyPreset('30')}>
            Last 30 days
          </Button>
          <Button variant="outline" onClick={() => applyPreset('90')}>
            Last 90 days
          </Button>
          <Button variant="outline" onClick={() => applyPreset('ytd')}>
            Year to date
          </Button>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>Map (published)</label>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Map views</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {mapViews}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Site clicks</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {markerClicks}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Book clicks</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {bookClicks}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Click-to-book %</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {clickToBook}%
          </div>
        </div>
      </div>

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
                      width: `${(n / topSites[0][1]) * 100}%`,
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
    </div>
  );
}

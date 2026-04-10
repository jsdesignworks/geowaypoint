'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { planAllowsProFeatures } from '@/lib/plan';

type EventRow = {
  id: string;
  resort_id: string;
  map_id: string;
  site_id: string | null;
  event: string;
  created_at: string;
};

type MapOpt = { id: string; name: string };

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

  const gated = !planAllowsProFeatures(plan);

  const filtered = useMemo(() => {
    const t0 = new Date(from).getTime();
    const t1 = new Date(to).getTime() + 86400000;
    return initialEvents.filter((e) => {
      const t = new Date(e.created_at).getTime();
      if (t < t0 || t > t1) {
        return false;
      }
      if (mapId && e.map_id !== mapId) {
        return false;
      }
      return true;
    });
  }, [initialEvents, from, to, mapId]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      m.set(e.event, (m.get(e.event) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  function csv() {
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

  if (gated) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0 }}>
          Analytics is a Pro feature
        </h2>
        <p style={{ color: 'var(--ink3)', fontSize: 14 }}>
          Upgrade to unlock date ranges, map filters, metrics, and CSV export (spec §16).
        </p>
        <Link href="/settings" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
          Billing &amp; upgrade
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>Map</label>
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
        <Button variant="outline" onClick={() => csv()}>
          Export CSV
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Events (range)</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {filtered.length}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Map views</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {filtered.filter((e) => e.event === 'map_view').length}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Site clicks</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {filtered.filter((e) => e.event === 'site_click').length}
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Book clicks</div>
          <div className="font-serif-heading" style={{ fontSize: '1.5rem', marginTop: 4 }}>
            {filtered.filter((e) => e.event === 'book_click').length}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Events by type
        </h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {byType.length === 0 ? (
            <p style={{ color: 'var(--ink3)', fontSize: 14 }}>No events in this range yet.</p>
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
                      width: `${Math.min(100, (count / filtered.length) * 100)}%`,
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

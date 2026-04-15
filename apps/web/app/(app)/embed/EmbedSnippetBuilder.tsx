'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';

type MapRow = { id: string; name: string; is_published: boolean | null };

function buildSnippet(opts: {
  cdnOrigin: string;
  resortSlug: string;
  mapId: string;
  apiBase: string;
  width: string;
  minHeight: number;
  showHeader: boolean;
  showFilters: boolean;
  showCompare: boolean;
  showFooter: boolean;
  showBook: boolean;
}) {
  const attrs: string[] = [
    `     data-resort="${opts.resortSlug}"`,
    `     data-map-id="${opts.mapId}"`,
    `     data-api-base="${opts.apiBase}"`,
  ];
  if (!opts.showHeader) attrs.push(`     data-show-header="false"`);
  if (!opts.showFilters) attrs.push(`     data-show-filters="false"`);
  if (!opts.showCompare) attrs.push(`     data-show-compare="false"`);
  if (!opts.showFooter) attrs.push(`     data-show-footer="false"`);
  if (!opts.showBook) attrs.push(`     data-show-book="false"`);
  const style = `width:${opts.width};min-height:${opts.minHeight}px;`;
  return `<script src="${opts.cdnOrigin}/embed.min.js" defer></script>
<div id="gw-map"
${attrs.join('\n')}
     style="${style}">
</div>`;
}

export function EmbedSnippetBuilder({
  resortSlug,
  maps,
  publicBase,
  cdnOrigin,
}: {
  resortSlug: string;
  maps: MapRow[];
  publicBase: string;
  cdnOrigin: string;
}) {
  const defaultMapId = useMemo(() => {
    const pub = maps.find((m) => m.is_published);
    return (pub ?? maps[0])?.id ?? '';
  }, [maps]);

  const [mapId, setMapId] = useState(defaultMapId);

  useEffect(() => {
    if (defaultMapId && !maps.some((m) => m.id === mapId)) {
      setMapId(defaultMapId);
    }
  }, [defaultMapId, mapId, maps]);
  const [width, setWidth] = useState('100%');
  const [minHeight, setMinHeight] = useState(520);
  const [showHeader, setShowHeader] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showCompare, setShowCompare] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showBook, setShowBook] = useState(true);
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () =>
      buildSnippet({
        cdnOrigin,
        resortSlug,
        mapId: mapId || defaultMapId || 'YOUR_MAP_UUID',
        apiBase: publicBase,
        width,
        minHeight,
        showHeader,
        showFilters,
        showCompare,
        showFooter,
        showBook,
      }),
    [
      cdnOrigin,
      resortSlug,
      mapId,
      defaultMapId,
      publicBase,
      width,
      minHeight,
      showHeader,
      showFilters,
      showCompare,
      showFooter,
      showBook,
    ]
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast('Snippet copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copy failed', 'error');
    }
  }

  return (
    <section className="card" style={{ padding: 20 }}>
      <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
        Install snippet
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
        Paste this on any page where you want the map. Host <code className="gw-code">embed.min.js</code> on your CDN;
        set <code className="gw-code">data-api-base</code> to <code className="gw-code">{publicBase}</code> when the
        script loads from another domain.
      </p>
      <div style={{ display: 'grid', gap: 12, marginTop: 14, maxWidth: 480 }}>
        <label style={{ fontSize: 11, fontWeight: 600 }}>Map</label>
        <select className="rf-input" value={mapId} onChange={(e) => setMapId(e.target.value)} style={{ maxWidth: 360 }}>
          {maps.length === 0 ? (
            <option value="">Create a map first</option>
          ) : (
            maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.is_published ? ' (published)' : ' (draft)'}
              </option>
            ))
          )}
        </select>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Width (CSS)</label>
            <Input value={width} onChange={(e) => setWidth(e.target.value)} style={{ width: 140 }} placeholder="100%" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Min height (px)</label>
            <Input
              type="number"
              min={200}
              max={2000}
              value={minHeight}
              onChange={(e) => setMinHeight(Number(e.target.value) || 520)}
              style={{ width: 120 }}
            />
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '0.04em' }}>SHOW ON MAP</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={showHeader} onChange={(e) => setShowHeader(e.target.checked)} />
          Header (title + controls row)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={showFilters} onChange={(e) => setShowFilters(e.target.checked)} />
          Status filters
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={showCompare} onChange={(e) => setShowCompare(e.target.checked)} />
          Compare mode
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} />
          Footer (availability summary)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={showBook} onChange={(e) => setShowBook(e.target.checked)} />
          Book button in site details
        </label>
      </div>
      <pre className="gw-code-block gw-code" style={{ marginTop: 14, fontSize: 12, overflow: 'auto' }}>
        {snippet}
      </pre>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </section>
  );
}

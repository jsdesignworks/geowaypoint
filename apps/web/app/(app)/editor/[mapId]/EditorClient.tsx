'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSite, deleteSites, updateSite } from '@/app/actions/sites';
import { HSPOT_COLORS } from '@/lib/constants/hspot';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MapPayload = {
  id: string;
  name: string;
  image_url: string | null;
  is_published: boolean | null;
  resort_slug: string;
};

export type SiteRow = {
  id: string;
  name: string;
  site_type: string | null;
  status: string | null;
  rate_night: number | null;
  max_length_ft: number | null;
  description: string | null;
  photo_url: string | null;
  pos_x: number | string | null;
  pos_y: number | string | null;
  ownerrez_property_id: string | null;
};

function numPct(v: number | string | null | undefined, fallback: number) {
  if (v === null || v === undefined) {
    return fallback;
  }
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}

export function EditorClient({
  map,
  initialSites,
}: {
  map: MapPayload;
  initialSites: SiteRow[];
}) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteRow[]>(initialSites);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'details' | 'booking' | 'position'>('details');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<unknown>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(
    null
  );
  const sitesRef = useRef(sites);
  sitesRef.current = sites;

  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  const primary = useMemo(() => {
    if (selected.size !== 1) {
      return null;
    }
    return sites.find((s) => selected.has(s.id)) ?? null;
  }, [selected, sites]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected.size === 0) {
          return;
        }
        e.preventDefault();
        void (async () => {
          const res = await deleteSites(Array.from(selected));
          if ('error' in res) {
            toast(res.error, 'error');
            return;
          }
          setSelected(new Set());
          toast('Sites removed', 'success');
          refresh();
        })();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, refresh]);

  function selectOne(id: string, additive: boolean) {
    if (additive) {
      setSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) {
          n.delete(id);
        } else {
          n.add(id);
        }
        return n;
      });
    } else {
      setSelected(new Set([id]));
    }
  }

  async function onAddSite() {
    const res = await addSite(map.id, `Site ${sites.length + 1}`);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    toast('Site added', 'success');
    if ('site' in res && res.site) {
      setSites((prev) => [...prev, res.site as SiteRow]);
      setSelected(new Set([res.site.id as string]));
    }
    refresh();
  }

  async function onStageDblClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!stageRef.current) {
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const res = await addSite(map.id, `Site ${sites.length + 1}`);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    if ('site' in res && res.site) {
      const id = res.site.id as string;
      await updateSite(id, { pos_x: x, pos_y: y });
      setSites((prev) => [...prev, { ...(res.site as SiteRow), pos_x: x, pos_y: y }]);
      setSelected(new Set([id]));
    }
    refresh();
  }

  function onHspotDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    const additive = e.shiftKey;
    selectOne(id, additive);
    const s = sites.find((x) => x.id === id);
    if (!s) {
      return;
    }
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      ox: numPct(s.pos_x, 50),
      oy: numPct(s.pos_y, 50),
    };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d || !stageRef.current) {
        return;
      }
      const rect = stageRef.current.getBoundingClientRect();
      const dx = ((e.clientX - d.startX) / rect.width) * 100;
      const dy = ((e.clientY - d.startY) / rect.height) * 100;
      const nx = Math.min(100, Math.max(0, d.ox + dx));
      const ny = Math.min(100, Math.max(0, d.oy + dy));
      setSites((prev) =>
        prev.map((s) => (s.id === d.id ? { ...s, pos_x: nx, pos_y: ny } : s))
      );
    }
    async function onUp() {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) {
        return;
      }
      const s = sitesRef.current.find((x) => x.id === d.id);
      if (!s) {
        return;
      }
      await updateSite(d.id, {
        pos_x: numPct(s.pos_x, 50),
        pos_y: numPct(s.pos_y, 50),
      });
      refresh();
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [refresh]);

  async function savePrimaryField(field: keyof SiteRow, value: string | number | null) {
    if (!primary) {
      return;
    }
    const patch: Record<string, string | number | null> = {};
    if (field === 'rate_night') {
      if (value === '' || value === null) {
        patch.rate_night = null;
      } else {
        const n = Number(value);
        patch.rate_night = Number.isFinite(n) ? n : null;
      }
    } else if (field === 'max_length_ft') {
      if (value === '' || value === null) {
        patch.max_length_ft = null;
      } else {
        const n = Number(value);
        patch.max_length_ft = Number.isFinite(n) ? n : null;
      }
    } else if (field === 'name') {
      patch.name = String(value);
    } else if (field === 'site_type') {
      patch.site_type = value ? String(value) : null;
    } else if (field === 'status') {
      patch.status = value ? String(value) : null;
    } else if (field === 'description') {
      patch.description = value ? String(value) : null;
    } else if (field === 'ownerrez_property_id') {
      patch.ownerrez_property_id = value ? String(value) : null;
    }
    const res = await updateSite(primary.id, patch);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    setSites((prev) =>
      prev.map((s) => (s.id === primary.id ? { ...s, ...patch } : s))
    );
    toast('Saved', 'success');
  }

  async function openPreview() {
    if (!map.is_published) {
      toast('Publish the map to preview the guest widget.', 'error');
      return;
    }
    if (!map.resort_slug) {
      toast('Resort slug missing.', 'error');
      return;
    }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      const r = await fetch(`${base}/api/embed/${encodeURIComponent(map.resort_slug)}/${map.id}`);
      if (!r.ok) {
        toast('Could not load preview', 'error');
        return;
      }
      const data = await r.json();
      setPreviewPayload(data);
      setPreviewOpen(true);
    } catch {
      toast('Could not load preview', 'error');
    }
  }

  return (
    <>
      {previewOpen && previewPayload ? (
        <div
          className="pm-modal-overlay"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onMouseDown={() => setPreviewOpen(false)}
        >
          <div
            className="card"
            style={{
              padding: 20,
              width: 'min(900px, 96vw)',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="font-serif-heading" style={{ margin: 0 }}>
                Guest preview
              </h2>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            <GuestPreviewFrame data={previewPayload as GuestEmbedData} />
          </div>
        </div>
      ) : null}

      <div className="editor-layout" style={{ flex: 1, minHeight: 0 }}>
        <aside className={`editor-left${leftCollapsed ? ' collapsed' : ''}`}>
          {!leftCollapsed ? (
            <>
              <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Sites</div>
                <Button variant="primary" style={{ width: '100%', marginTop: 8 }} onClick={() => void onAddSite()}>
                  Add site
                </Button>
              </div>
              <div style={{ overflow: 'auto', flex: 1 }}>
                {sites.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => selectOne(s.id, e.shiftKey)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      background: selected.has(s.id) ? 'var(--fog)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui), system-ui, sans-serif',
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        marginRight: 8,
                        background: HSPOT_COLORS[i % HSPOT_COLORS.length],
                      }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-outline"
            style={{ margin: 4, padding: '2px 6px', fontSize: 11 }}
            onClick={() => setLeftCollapsed(!leftCollapsed)}
          >
            {leftCollapsed ? '→' : '←'}
          </button>
        </aside>

        <div className="editor-canvas-wrap">
          <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="outline" onClick={() => void openPreview()}>
              Preview guest view
            </Button>
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Shift+click multi-select · Delete removes · Double-click map to add
            </span>
          </div>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
            <div
              ref={stageRef}
              className="map-stage"
              style={{ cursor: 'crosshair' }}
              onDoubleClick={(e) => void onStageDblClick(e)}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
                  if (!e.shiftKey) {
                    setSelected(new Set());
                  }
                }
              }}
            >
              {map.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={map.image_url} alt="" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
              ) : (
                <div
                  style={{
                    width: 560,
                    height: 360,
                    background: 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink3)',
                  }}
                >
                  Upload a map image from the Maps page (re-upload) or onboarding.
                </div>
              )}
              {sites.map((s, i) => (
                <div
                  key={s.id}
                  role="presentation"
                  className={`hspot${selected.has(s.id) ? ' hs-sel' : ''}`}
                  style={{
                    left: `${numPct(s.pos_x, 50)}%`,
                    top: `${numPct(s.pos_y, 50)}%`,
                    background: HSPOT_COLORS[i % HSPOT_COLORS.length],
                  }}
                  onMouseDown={(e) => onHspotDown(e, s.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`editor-right-wrap${rightCollapsed ? ' collapsed' : ''}`}>
          {!rightCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {(['details', 'booking', 'position'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      border: 'none',
                      background: tab === t ? 'var(--fog)' : 'transparent',
                      fontSize: 12,
                      fontWeight: tab === t ? 600 : 400,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ padding: 14, overflow: 'auto', flex: 1 }}>
                {!primary ? (
                  <p style={{ color: 'var(--ink3)', fontSize: 13, margin: 0 }}>
                    Select one site to edit details.
                  </p>
                ) : tab === 'details' ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Name</label>
                    <Input
                      defaultValue={primary.name}
                      key={primary.id + 'name'}
                      onBlur={(e) => void savePrimaryField('name', e.target.value)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Type</label>
                    <Input
                      defaultValue={primary.site_type ?? ''}
                      key={primary.id + 'type'}
                      placeholder="RV, Cabin…"
                      onBlur={(e) => void savePrimaryField('site_type', e.target.value || null)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Status</label>
                    <Input
                      defaultValue={primary.status ?? ''}
                      key={primary.id + 'st'}
                      placeholder="available"
                      onBlur={(e) => void savePrimaryField('status', e.target.value || null)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Nightly rate</label>
                    <Input
                      type="number"
                      defaultValue={primary.rate_night ?? ''}
                      key={primary.id + 'rate'}
                      onBlur={(e) => void savePrimaryField('rate_night', e.target.value)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Max length (ft)</label>
                    <Input
                      type="number"
                      defaultValue={primary.max_length_ft ?? ''}
                      key={primary.id + 'len'}
                      onBlur={(e) => void savePrimaryField('max_length_ft', e.target.value)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Description</label>
                    <textarea
                      className="rf-input"
                      defaultValue={primary.description ?? ''}
                      key={primary.id + 'desc'}
                      rows={4}
                      style={{ width: '100%', resize: 'vertical' }}
                      onBlur={(e) => void savePrimaryField('description', e.target.value || null)}
                    />
                  </div>
                ) : tab === 'booking' ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
                      Map to an OwnerRez property (spec §15).
                    </p>
                    <label style={{ fontSize: 11, fontWeight: 600 }}>OwnerRez property ID</label>
                    <Input
                      defaultValue={primary.ownerrez_property_id ?? ''}
                      key={primary.id + 'or'}
                      onBlur={(e) =>
                        void savePrimaryField('ownerrez_property_id', e.target.value || null)
                      }
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
                    <div>X: {numPct(primary.pos_x, 50).toFixed(1)}%</div>
                    <div>Y: {numPct(primary.pos_y, 50).toFixed(1)}%</div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="btn btn-outline"
            style={{ margin: 4, padding: '2px 6px', fontSize: 11, alignSelf: 'flex-start' }}
            onClick={() => setRightCollapsed(!rightCollapsed)}
          >
            {rightCollapsed ? '←' : '→'}
          </button>
        </div>
      </div>
    </>
  );
}

type GuestEmbedData = {
  map: { id: string; name: string; image_url: string | null };
  sites: SiteRow[];
};

function GuestPreviewFrame({ data }: { data: GuestEmbedData }) {
  const { map: m, sites: ss } = data;
  const [pop, setPop] = useState<SiteRow | null>(null);
  return (
    <div style={{ marginTop: 16 }}>
      <div className="map-stage" style={{ maxWidth: '100%' }}>
        {m.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.image_url} alt="" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
        ) : null}
        {ss.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="hspot"
            style={{
              left: `${numPct(s.pos_x, 50)}%`,
              top: `${numPct(s.pos_y, 50)}%`,
              background: HSPOT_COLORS[i % HSPOT_COLORS.length],
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
            aria-label={s.name}
            onClick={() => setPop(s)}
          />
        ))}
      </div>
      {pop ? (
        <div
          className="card"
          style={{
            marginTop: 16,
            padding: 16,
            maxWidth: 360,
            border: '1px solid var(--border)',
          }}
        >
          <div className="font-serif-heading">{pop.name}</div>
          {pop.rate_night != null ? <div>${Number(pop.rate_night)}/night</div> : null}
          {pop.description ? <p style={{ fontSize: 14 }}>{pop.description}</p> : null}
          <Button variant="primary" style={{ marginTop: 8 }} onClick={() => setPop(null)}>
            Close
          </Button>
        </div>
      ) : null}
    </div>
  );
}

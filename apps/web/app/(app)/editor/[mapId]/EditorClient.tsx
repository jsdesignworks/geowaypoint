'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleMapPublished, updateMapGuestSiteDetailMode } from '@/app/actions/maps';
import { addSite, deleteSites, updateSite } from '@/app/actions/sites';
import { hotspotColorForStatus } from '@/lib/constants/hspot';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuestMapPreviewModal } from '@/components/preview/GuestMapPreviewModal';

type MapPayload = {
  id: string;
  name: string;
  image_url: string | null;
  is_published: boolean | null;
  resort_slug: string;
  guest_site_detail_mode: 'popup' | 'sidebar';
};

export type SiteRow = {
  id: string;
  name: string;
  display_code: string | null;
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
  resortName,
  map,
  initialSites,
}: {
  resortName: string;
  map: MapPayload;
  initialSites: SiteRow[];
}) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteRow[]>(initialSites);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'details' | 'booking' | 'position'>('details');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [published, setPublished] = useState(!!map.is_published);
  const [guestDetailMode, setGuestDetailMode] = useState<'popup' | 'sidebar'>(map.guest_site_detail_mode);
  const [siteSearch, setSiteSearch] = useState('');
  const [placeMode, setPlaceMode] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(
    null
  );
  const sitesRef = useRef(sites);
  sitesRef.current = sites;

  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  useEffect(() => {
    setPublished(!!map.is_published);
  }, [map.is_published]);

  useEffect(() => {
    setGuestDetailMode(map.guest_site_detail_mode);
  }, [map.guest_site_detail_mode]);

  const primary = useMemo(() => {
    if (selected.size !== 1) {
      return null;
    }
    return sites.find((s) => selected.has(s.id)) ?? null;
  }, [selected, sites]);

  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) {
      return sites;
    }
    return sites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.site_type ?? '').toLowerCase().includes(q) ||
        (s.status ?? '').toLowerCase().includes(q)
    );
  }, [sites, siteSearch]);

  useEffect(() => {
    if (primary && rightCollapsed) {
      setRightCollapsed(false);
    }
  }, [primary, rightCollapsed]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape') {
        setPlaceMode(false);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toast('Fields save when you leave each field. Use Save & publish when you are ready to go live.', 'info');
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        toast('Undo is not available yet.', 'info');
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

  async function duplicateSite(src: SiteRow) {
    const res = await addSite(map.id, `${src.name} Copy`);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    if ('site' in res && res.site) {
      const id = res.site.id as string;
      await updateSite(id, {
        pos_x: numPct(src.pos_x, 50),
        pos_y: numPct(src.pos_y, 50),
        site_type: src.site_type,
        status: src.status,
        rate_night: src.rate_night,
        max_length_ft: src.max_length_ft,
        description: src.description,
        display_code: src.display_code,
        ownerrez_property_id: src.ownerrez_property_id,
      });
      setSites((prev) => [
        ...prev,
        {
          ...(res.site as SiteRow),
          pos_x: src.pos_x,
          pos_y: src.pos_y,
          site_type: src.site_type,
          status: src.status,
          rate_night: src.rate_night,
          max_length_ft: src.max_length_ft,
          description: src.description,
          display_code: src.display_code,
          ownerrez_property_id: src.ownerrez_property_id,
        },
      ]);
      setSelected(new Set([id]));
    }
    toast('Duplicated', 'success');
    refresh();
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

  async function addSiteAtPct(x: number, y: number) {
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
    setPlaceMode(false);
    refresh();
  }

  async function onStageDblClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!stageRef.current) {
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    await addSiteAtPct(x, y);
  }

  function onStageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placeMode || !stageRef.current) {
      return;
    }
    if ((e.target as HTMLElement).classList.contains('hspot')) {
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    void addSiteAtPct(x, y);
  }

  function onHspotDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
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
    } else if (field === 'photo_url') {
      patch.photo_url = value ? String(value) : null;
    } else if (field === 'display_code') {
      const v = value != null ? String(value).trim().slice(0, 8) : '';
      patch.display_code = v ? v : null;
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

  function openGuestPreview() {
    if (!published) {
      toast('Publish the map first, then preview the guest experience.', 'error');
      return;
    }
    if (!map.resort_slug) {
      toast('Resort slug is missing. Save your resort profile in Settings.', 'error');
      return;
    }
    setPreviewModalOpen(true);
  }

  async function saveAndPublish() {
    if (!map.resort_slug) {
      toast('Set your resort slug in Settings before publishing.', 'error');
      return;
    }
    if (!published) {
      const res = await toggleMapPublished(map.id, true);
      if ('error' in res) {
        toast(res.error, 'error');
        return;
      }
      setPublished(true);
      toast('Map is live and ready to embed', 'success');
    } else {
      toast('Map is already live. Site details save as you edit.', 'info');
    }
    refresh();
  }

  async function bulkDeleteSelected() {
    if (selected.size === 0) return;
    const res = await deleteSites(Array.from(selected));
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    setSelected(new Set());
    toast('Sites removed', 'success');
    refresh();
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <GuestMapPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        resortName={resortName}
        resortSlug={map.resort_slug || null}
        mapId={published ? map.id : null}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: '#fff',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/maps" className="btn btn-outline" style={{ padding: '6px 12px' }}>
          ← Maps
        </Link>
        <span style={{ color: 'var(--ink3)', fontSize: 13 }}>/</span>
        <span className="font-serif-heading" style={{ fontSize: '1.1rem' }}>
          {map.name}
        </span>
        <span className={`pill ${published ? 'pill-green' : 'pill-gray'}`} style={{ fontSize: 11 }}>
          {published ? 'Live' : 'Draft'}
        </span>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--ink3)',
            marginLeft: 4,
          }}
        >
          Guest detail
          <select
            className="rf-input"
            style={{ padding: '6px 10px', fontSize: 13, minWidth: 120 }}
            value={guestDetailMode}
            onChange={(e) => {
              const v = e.target.value === 'sidebar' ? 'sidebar' : 'popup';
              setGuestDetailMode(v);
              void (async () => {
                const res = await updateMapGuestSiteDetailMode(map.id, v);
                if ('error' in res) {
                  toast(res.error, 'error');
                  setGuestDetailMode(map.guest_site_detail_mode);
                  return;
                }
                toast('Guest layout saved', 'success');
                refresh();
              })();
            }}
          >
            <option value="popup">Popup</option>
            <option value="sidebar">Sidebar</option>
          </select>
        </label>
        <div style={{ flex: 1, minWidth: 8 }} />
        <Button variant="outline" onClick={() => openGuestPreview()}>
          Preview
        </Button>
        <Button variant="primary" onClick={() => void saveAndPublish()}>
          Save &amp; publish
        </Button>
      </div>

      <div className="editor-layout" style={{ flex: 1, minHeight: 0 }}>
        <aside className={`editor-left${leftCollapsed ? ' collapsed' : ''}`}>
          {!leftCollapsed ? (
            <>
              <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Sites</div>
                <Input
                  placeholder="Search sites…"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  style={{ marginTop: 8 }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <Button variant="primary" style={{ flex: 1 }} onClick={() => void onAddSite()}>
                    Add site
                  </Button>
                  <Button
                    variant={placeMode ? 'primary' : 'outline'}
                    onClick={() => setPlaceMode((p) => !p)}
                  >
                    Place
                  </Button>
                </div>
              </div>
              {selected.size > 1 ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--fog)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {selected.size} sites selected
                  </span>
                  <Button variant="outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => void bulkDeleteSelected()}>
                    Remove
                  </Button>
                  <button type="button" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                </div>
              ) : null}
              <div style={{ overflow: 'auto', flex: 1 }}>
                {filteredSites.map((s, i) => {
                  const idx = sites.findIndex((x) => x.id === s.id);
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border)',
                        background: selected.has(s.id) ? 'var(--fog)' : 'transparent',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => selectOne(s.id, e.shiftKey)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
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
                            background: hotspotColorForStatus(s.status, idx >= 0 ? idx : i),
                          }}
                        />
                        {s.name}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: 11, marginRight: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void duplicateSite(s);
                        }}
                      >
                        Dup
                      </button>
                    </div>
                  );
                })}
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

        <div
          ref={canvasWrapRef}
          className="editor-canvas-wrap"
          onWheel={(e) => {
            e.preventDefault();
            setCanvasScale((prev) =>
              Math.min(2, Math.max(0.5, prev - e.deltaY * 0.0015))
            );
          }}
        >
          <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Wheel zoom · Shift/Cmd/Ctrl+click multi-select · Place mode · Esc cancels place · Del removes selection
            </span>
          </div>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
            <div
              ref={stageRef}
              className="map-stage"
              style={{
                cursor: placeMode ? 'crosshair' : 'default',
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top center',
              }}
              onClick={(e) => void onStageClick(e)}
              onDoubleClick={(e) => void onStageDblClick(e)}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
                  if (!e.shiftKey && !placeMode) {
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
                    background: hotspotColorForStatus(s.status, i),
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
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Map label</label>
                    <Input
                      defaultValue={primary.display_code ?? ''}
                      key={primary.id + 'dcode'}
                      placeholder="e.g. A1, B2"
                      maxLength={8}
                      onBlur={(e) => void savePrimaryField('display_code', e.target.value || null)}
                    />
                    <p style={{ fontSize: 11, color: 'var(--ink3)', margin: 0 }}>
                      Shown on the guest map. Leave blank to auto-generate from the name.
                    </p>
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Photo URL</label>
                    <Input
                      defaultValue={primary.photo_url ?? ''}
                      key={primary.id + 'photo'}
                      placeholder="https://…"
                      onBlur={(e) => void savePrimaryField('photo_url', e.target.value || null)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Type</label>
                    <Input
                      defaultValue={primary.site_type ?? ''}
                      key={primary.id + 'type'}
                      placeholder="RV, Cabin…"
                      onBlur={(e) => void savePrimaryField('site_type', e.target.value || null)}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600 }}>Status</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(['available', 'occupied', 'reserved', 'maintenance'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          data-status={st}
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            borderColor:
                              (primary.status ?? 'available').toLowerCase() === st
                                ? 'var(--leaf)'
                                : undefined,
                          }}
                          onClick={() => void savePrimaryField('status', st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
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
                      Link this site to an OwnerRez property for synced availability and booking handoff.
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
    </div>
  );
}

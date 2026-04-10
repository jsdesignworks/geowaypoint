'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createMap, deleteMap, renameMap, toggleMapPublished } from '@/app/actions/maps';
import { maxMapsForPlan, planAllowsUnlimitedMaps } from '@/lib/plan';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MapRow = {
  id: string;
  name: string;
  image_url: string | null;
  is_published: boolean | null;
  created_at: string;
};

function relativeUpdated(d: Date): string {
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function MapThumb({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" />
    );
  }
  return (
    <>
      <svg className="map-card-thumb-deco" viewBox="0 0 320 160" preserveAspectRatio="none" aria-hidden>
        <path
          d="M20 120 L80 40 L140 90 L220 30 L300 100"
          stroke="white"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}

export function MapsClient({
  resortId,
  initialMaps,
  siteCounts,
  plan,
}: {
  resortId: string;
  initialMaps: MapRow[];
  siteCounts: Record<string, number>;
  plan: string;
}) {
  const router = useRouter();
  const [maps, setMaps] = useState(initialMaps);
  const [counts, setCounts] = useState(siteCounts);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMaps(initialMaps);
  }, [initialMaps]);

  useEffect(() => {
    setCounts(siteCounts);
  }, [siteCounts]);

  async function refresh() {
    router.refresh();
    const supabase = createClient();
    const { data } = await supabase
      .from('maps')
      .select('id, name, image_url, is_published, created_at')
      .eq('resort_id', resortId)
      .order('created_at', { ascending: false });
    setMaps(data ?? []);
    const { data: siteRows } = await supabase.from('sites').select('map_id').eq('resort_id', resortId);
    const next: Record<string, number> = {};
    for (const s of siteRows ?? []) {
      if (s.map_id) {
        next[s.map_id] = (next[s.map_id] ?? 0) + 1;
      }
    }
    setCounts(next);
  }

  async function onAddMap(file: File | null) {
    if (!file) return;
    const cap = maxMapsForPlan(plan);
    if (!planAllowsUnlimitedMaps(plan) && maps.length >= cap) {
      toast(`Your plan allows ${cap} map(s). Upgrade in Settings.`, 'error');
      return;
    }
    const res = await createMap('New Map');
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    const mapId = 'id' in res ? res.id : null;
    if (!mapId) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/${mapId}/${file.name}`;
    const { error: upErr } = await supabase.storage.from('maps').upload(path, file, { upsert: true });
    if (upErr) {
      toast(upErr.message, 'error');
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('maps').getPublicUrl(path);
    await supabase.from('maps').update({ image_url: publicUrl }).eq('id', mapId);
    toast('Map created', 'success');
    void refresh();
  }

  async function confirmRename() {
    if (!renameId) return;
    const res = await renameMap(renameId, renameValue);
    setRenameId(null);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    toast('Map renamed', 'success');
    void refresh();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await deleteMap(deleteId);
    setDeleteId(null);
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    toast('Map deleted', 'success');
    void refresh();
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          void onAddMap(f ?? null);
        }}
      />

      {renameId ? (
        <div className="pm-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: 24, width: 'min(400px, 92vw)' }} onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="font-serif-heading" style={{ marginTop: 0 }}>
              Rename map
            </h2>
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button variant="primary" onClick={() => void confirmRename()}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setRenameId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="pm-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: 24, width: 'min(400px, 92vw)' }}>
            <h2 className="font-serif-heading" style={{ marginTop: 0 }}>
              Delete map?
            </h2>
            <p style={{ color: 'var(--ink3)', fontSize: 14 }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button variant="danger" onClick={() => void confirmDelete()}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} role="group" aria-label="Map layout">
          <button
            type="button"
            className={view === 'grid' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            className={view === 'list' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
        <Button variant="primary" onClick={() => fileRef.current?.click()}>
          + New map
        </Button>
      </div>

      <div className={view === 'list' ? 'maps-grid maps-view-list' : 'maps-grid'}>
        {maps.map((m) => {
          const nSites = counts[m.id] ?? 0;
          return (
            <div key={m.id} className="map-card">
              <div className="map-card-thumb">
                <MapThumb imageUrl={m.image_url} />
              </div>
              <div className="map-card-body">
                <div className="map-card-title">{m.name}</div>
                <div className="map-card-meta">
                  {nSites} site{nSites === 1 ? '' : 's'} · Edited {relativeUpdated(new Date(m.created_at))}
                </div>
              </div>
              <div className="map-card-foot">
                <span className={`pill ${m.is_published ? 'pill-green' : 'pill-gray'}`}>
                  {m.is_published ? 'Published' : 'Draft'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', minWidth: 36 }}
                      aria-label="Map actions"
                      onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                    >
                      ⋮
                    </button>
                    {openMenu === m.id ? (
                      <div className="map-dropdown">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            setRenameId(m.id);
                            setRenameValue(m.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenMenu(null);
                            const res = await toggleMapPublished(m.id, !m.is_published);
                            if ('error' in res) {
                              toast(res.error, 'error');
                            } else {
                              toast(m.is_published ? 'Unpublished' : 'Published', 'success');
                              void refresh();
                            }
                          }}
                        >
                          {m.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            setDeleteId(m.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <Link href={`/editor/${m.id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13 }}>
                    Edit map
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        <button type="button" className="map-add-card" onClick={() => fileRef.current?.click()}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4M8 14h8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Add map</span>
          <span className="map-add-card-hint">PNG, JPG, or PDF · Max 50 MB</span>
        </button>
      </div>
    </div>
  );
}

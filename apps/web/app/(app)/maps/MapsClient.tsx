'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createMap, deleteMap, renameMap, toggleMapPublished } from '@/app/actions/maps';
import { planAllowsUnlimitedMaps, starterMapLimit } from '@/lib/plan';
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

export function MapsClient({
  resortId,
  initialMaps,
  plan,
}: {
  resortId: string;
  initialMaps: MapRow[];
  plan: string;
}) {
  const router = useRouter();
  const [maps, setMaps] = useState(initialMaps);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    router.refresh();
    const supabase = createClient();
    const { data } = await supabase
      .from('maps')
      .select('id, name, image_url, is_published, created_at')
      .eq('resort_id', resortId)
      .order('created_at', { ascending: false });
    setMaps(data ?? []);
  }

  async function onAddMap(file: File | null) {
    if (!file) return;
    if (!planAllowsUnlimitedMaps(plan) && maps.length >= starterMapLimit()) {
      toast(`Starter plan allows up to ${starterMapLimit()} maps. Upgrade in Settings.`, 'error');
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {maps.map((m) => (
          <div key={m.id} className="map-card">
            <div className="map-card-thumb">
              {m.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                'No image'
              )}
            </div>
            <div className="map-card-body">
              <div className="font-serif-heading" style={{ fontSize: '1.05rem' }}>
                {m.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                {new Date(m.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="map-card-foot">
              <span className={`pill ${m.is_published ? 'pill-green' : 'pill-gray'}`}>
                {m.is_published ? 'Published' : 'Draft'}
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '4px 10px' }}
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
              <Link href={`/editor/${m.id}`} className="btn btn-primary" style={{ padding: '6px 12px' }}>
                Edit
              </Link>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="map-add-card"
          onClick={() => fileRef.current?.click()}
        >
          <span style={{ fontSize: 28 }}>+</span>
          <span>Add Map</span>
        </button>
      </div>
    </div>
  );
}

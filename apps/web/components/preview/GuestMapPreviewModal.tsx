'use client';

import { useEffect, useState } from 'react';
import {
  PublicGuestMapView,
  type PublicGuestEmbedData,
} from '@/components/embed/PublicGuestMapView';

export function GuestMapPreviewModal({
  open,
  onClose,
  resortName,
  resortSlug,
  mapId,
}: {
  open: boolean;
  onClose: () => void;
  resortName: string;
  resortSlug: string | null;
  mapId: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<PublicGuestEmbedData | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !resortSlug || !mapId) {
      setData(null);
      setErr(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setData(null);
    const url = `/api/embed/${encodeURIComponent(resortSlug)}/${encodeURIComponent(mapId)}`;
    void fetch(url, { cache: 'no-store' }).then(async (r) => {
      let body: unknown;
      try {
        body = await r.json();
      } catch {
        body = null;
      }
      if (cancelled) return;
      if (!r.ok) {
        const msg =
          r.status === 403
            ? 'This map is not published yet.'
            : r.status === 402
              ? 'A subscription is required to view this map.'
              : r.status === 404
                ? 'Map not found.'
                : 'Could not load preview.';
        setErr(msg);
        setLoading(false);
        return;
      }
      const d = body as PublicGuestEmbedData;
      const mode =
        d?.map?.guest_site_detail_mode === 'sidebar' ? 'sidebar' : 'popup';
      const merged: PublicGuestEmbedData =
        d?.resort && resortName.trim()
          ? {
              ...d,
              resort: { ...d.resort, name: resortName },
              map: { ...d.map, guest_site_detail_mode: mode },
            }
          : { ...d, map: { ...d.map, guest_site_detail_mode: mode } };
      setData(merged);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, resortSlug, mapId, resortName]);

  if (!mounted || !open) return null;

  const canLoad = Boolean(resortSlug && mapId);

  return (
    <div
      className="gw-preview-overlay pm-modal-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 600,
      }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="gw-preview-modal card"
        style={{
          width: 'min(960px, 100%)',
          height: 'min(85vh, 800px)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
        role="dialog"
        aria-modal
        aria-label="Guest map preview"
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: 'var(--fog)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {!canLoad ? (
            <div style={{ padding: 24, color: 'var(--ink3)', fontSize: 14 }}>
              Publish a map to preview the guest experience here.
            </div>
          ) : loading ? (
            <div style={{ padding: 24, color: 'var(--ink3)', fontSize: 14 }}>Loading preview…</div>
          ) : err ? (
            <div style={{ padding: 24, color: 'var(--ink3)', fontSize: 14 }}>{err}</div>
          ) : data ? (
            <PublicGuestMapView data={data} layout="embedded" onClose={onClose} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GuestPreviewLauncher({
  resortSlug,
  mapId,
  resortName,
  label,
  className,
}: {
  resortSlug: string;
  mapId: string | null;
  resortName: string;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className ?? 'btn-hero btn-hero-outline'} onClick={() => setOpen(true)}>
        {label}
      </button>
      <GuestMapPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        resortName={resortName}
        resortSlug={resortSlug}
        mapId={mapId}
      />
    </>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Spec §16 — upgrade gate modal */
export function UpgradeGateModal({
  open,
  title,
  body,
  feature,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  feature: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }
  return (
    <div
      className="pm-modal-overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}
      onMouseDown={onClose}
    >
      <div
        className="card"
        style={{ padding: 24, width: 'min(420px, 92vw)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }} aria-hidden>
          🔒
        </div>
        <h2 className="font-serif-heading" style={{ marginTop: 0 }}>
          {title}
        </h2>
        <p style={{ color: 'var(--ink3)', fontSize: 14, marginTop: 0 }}>{body}</p>
        <p style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>feature: {feature}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Link href="/settings#sp-billing" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
            View plans &amp; upgrade
          </Link>
          <Button variant="outline" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}

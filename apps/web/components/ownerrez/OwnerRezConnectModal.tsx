'use client';

import { Button } from '@/components/ui/button';

/** Spec §11 — 4-step OwnerRez connect walkthrough (static; OAuth completes in Edge Function). */
export function OwnerRezConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }
  const steps = [
    'Log into OwnerRez at app.ownerrez.com.',
    'Click “Authorize GeoWaypoint” to start OAuth (redirects to OwnerRez).',
    'Approve the app — you return to GeoWaypoint with a stored token (Edge Function).',
    'Map OwnerRez properties to sites in the Map Editor → Booking tab.',
  ];
  return (
    <div
      className="pm-modal-overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4500 }}
      onMouseDown={onClose}
    >
      <div
        className="card or-connect-modal"
        style={{ padding: 24, width: 'min(520px, 94vw)', maxHeight: '90vh', overflow: 'auto' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif-heading" style={{ marginTop: 0 }}>
          Connect OwnerRez
        </h2>
        <ol style={{ paddingLeft: 18, color: 'var(--ink2)', fontSize: 14, lineHeight: 1.6 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              {s}
            </li>
          ))}
        </ol>
        <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
          Callback URL for your OAuth app:{' '}
          <code style={{ wordBreak: 'break-all' }}>https://api.geowaypoint.io/oauth/ownerrez/callback</code> (or your
          deployed Edge Function URL).
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <a
            className="btn btn-primary"
            href="https://app.ownerrez.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open OwnerRez
          </a>
        </div>
      </div>
    </div>
  );
}

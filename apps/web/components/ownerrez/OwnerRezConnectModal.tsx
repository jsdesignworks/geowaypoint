'use client';

import { Button } from '@/components/ui/button';

function callbackUrlHint() {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return base ? `${base}/api/oauth/ownerrez/callback` : '/api/oauth/ownerrez/callback';
}

/** OwnerRez OAuth walkthrough; authorization uses `/api/oauth/ownerrez/authorize` per OwnerRez OAuth app docs. */
export function OwnerRezConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }
  const steps = [
    'Register an OAuth app in OwnerRez and set the redirect URL to match GeoWaypoint (see below).',
    'Click “Authorize with OwnerRez” — you will sign in at OwnerRez and approve access.',
    'After approval, GeoWaypoint stores the access token for quotes and booking handoff.',
    'Map OwnerRez property IDs on each site in the Map Editor → Booking tab.',
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
          <strong>OAuth redirect URL</strong> to register in OwnerRez:{' '}
          <code style={{ wordBreak: 'break-all' }}>{callbackUrlHint()}</code>
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>
          Request the <strong>smallest scope set</strong> that still allows property reads and quote checkout for mapped
          sites — see{' '}
          <a
            href="https://www.ownerrez.com/support/articles/api-oauth-app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sky)', fontWeight: 600 }}
          >
            OwnerRez OAuth app
          </a>{' '}
          and <strong>Settings → Integrations</strong> for scope notes.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <a className="btn btn-primary" href="/api/oauth/ownerrez/authorize">
            Authorize with OwnerRez
          </a>
          <a
            className="btn btn-outline"
            href="https://www.ownerrez.com/support/articles/api-oauth-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            OAuth documentation
          </a>
        </div>
      </div>
    </div>
  );
}

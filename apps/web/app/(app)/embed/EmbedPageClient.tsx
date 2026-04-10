'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { OwnerRezConnectModal } from '@/components/ownerrez/OwnerRezConnectModal';

type SiteMapRow = {
  id: string;
  name: string;
  ownerrez_property_id: string | null;
};

export function EmbedPageClient({
  snippet,
  publicBase,
  ownerRezConnected,
  siteMappings,
}: {
  snippet: string;
  publicBase: string;
  ownerRezConnected: boolean;
  siteMappings: SiteMapRow[];
}) {
  const [copied, setCopied] = useState(false);
  const [orOpen, setOrOpen] = useState(false);

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
    <div style={{ display: 'grid', gap: 24 }}>
      <OwnerRezConnectModal open={orOpen} onClose={() => setOrOpen(false)} />

      <section className="card" style={{ padding: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Install snippet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Paste this on any page where you want the map. Host <code className="gw-code">embed.min.js</code> on
          your CDN; set <code className="gw-code">data-api-base</code> to{' '}
          <code className="gw-code">{publicBase}</code> when the script loads from another domain.
        </p>
        <pre className="gw-code-block gw-code" style={{ marginTop: 12 }}>
          {snippet}
        </pre>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} id="ownerrez-connect">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          OwnerRez integration
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: ownerRezConnected ? 'var(--canopy)' : 'var(--amber)',
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {ownerRezConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Connect OwnerRez to sync property availability and drive booking quotes from the guest map. Webhook
          delivery history is under <strong>Settings → OwnerRez</strong>.
        </p>
        <Button variant="primary" style={{ marginTop: 12 }} onClick={() => setOrOpen(true)}>
          {ownerRezConnected ? 'Manage connection' : 'Connect OwnerRez'}
        </Button>

        <h3 className="font-serif-heading" style={{ fontSize: '1rem', marginTop: 24, marginBottom: 8 }}>
          What syncs
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Site status and booking links can reflect OwnerRez when properties are mapped below.
        </p>

        <h3 className="font-serif-heading" style={{ fontSize: '1rem', marginTop: 20, marginBottom: 8 }}>
          Property mapping
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 8 }}>GeoWaypoint site</th>
                <th style={{ padding: 8 }}>OwnerRez property</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {siteMappings.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 12, color: 'var(--ink3)' }}>
                    No sites yet. Add sites in the map editor, then map OwnerRez property IDs in site details.
                  </td>
                </tr>
              ) : (
                siteMappings.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8 }}>{s.name}</td>
                    <td style={{ padding: 8 }}>
                      <code className="gw-code">{s.ownerrez_property_id ?? '—'}</code>
                    </td>
                    <td style={{ padding: 8 }}>
                      <span className={`pill ${s.ownerrez_property_id ? 'pill-green' : 'pill-amber'}`}>
                        {s.ownerrez_property_id ? 'Mapped' : 'Map'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Button variant="outline" style={{ marginTop: 12 }} disabled>
          Sync properties from OwnerRez
        </Button>
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          GeoWaypoint API key
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Use for server-to-server calls. Rotate if exposed.
        </p>
        <pre
          className="gw-code"
          style={{
            padding: 12,
            background: 'var(--fog)',
            borderRadius: 8,
            wordBreak: 'break-all',
            border: '1px solid var(--border)',
          }}
        >
          {`gw_live_sk_${'•'.repeat(24)}`}
        </pre>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Button variant="outline" disabled>
            Copy key
          </Button>
          <Button variant="outline" disabled>
            Rotate
          </Button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 16, marginBottom: 0 }}>
          OAuth for OwnerRez uses your app registration in OwnerRez developer settings; complete the connection
          wizard above to authorize GeoWaypoint.
        </p>
      </section>
    </div>
  );
}

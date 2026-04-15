'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OwnerRezConnectModal } from '@/components/ownerrez/OwnerRezConnectModal';
import { EmbedSnippetBuilder } from '@/app/(app)/embed/EmbedSnippetBuilder';
import { planAllowsApiAccess, planAllowsOwnerRezSync } from '@/lib/plan';
import { PlanGateTooltip } from '@/components/ui/PlanGateTooltip';

type SiteMapRow = {
  id: string;
  name: string;
  ownerrez_property_id: string | null;
};

type MapRow = { id: string; name: string; is_published: boolean | null };

export function EmbedPageClient({
  resortSlug,
  maps,
  publicBase,
  cdnOrigin,
  ownerRezIntegrationEnabled,
  ownerRezConnected,
  siteMappings,
  plan,
}: {
  resortSlug: string;
  maps: MapRow[];
  publicBase: string;
  cdnOrigin: string;
  ownerRezIntegrationEnabled: boolean;
  ownerRezConnected: boolean;
  siteMappings: SiteMapRow[];
  plan: string;
}) {
  const [orOpen, setOrOpen] = useState(false);
  const [apiHelpOpen, setApiHelpOpen] = useState(false);
  const orAllowed = ownerRezIntegrationEnabled && planAllowsOwnerRezSync(plan);
  const apiAllowed = planAllowsApiAccess(plan);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <OwnerRezConnectModal open={orOpen} onClose={() => setOrOpen(false)} />

      <EmbedSnippetBuilder resortSlug={resortSlug} maps={maps} publicBase={publicBase} cdnOrigin={cdnOrigin} />

      {orAllowed ? (
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
            delivery history is under <strong>Settings → Integrations</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Button variant="primary" onClick={() => setOrOpen(true)}>
              {ownerRezConnected ? 'Manage connection' : 'Connect OwnerRez'}
            </Button>
            <a className="btn btn-outline" href="/api/oauth/ownerrez/authorize">
              Start OAuth
            </a>
          </div>

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
          <PlanGateTooltip
            gated
            title="Coming soon"
            reason="Bulk sync from OwnerRez will ship in a later release."
            helpHref="/help#help-embed"
          >
            <Button variant="outline" style={{ marginTop: 12 }} disabled>
              Sync properties from OwnerRez
            </Button>
          </PlanGateTooltip>
        </section>
      ) : (
        <section className="card" style={{ padding: 20 }}>
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            OwnerRez integration
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
            Turn on OwnerRez under{' '}
            <Link href="/settings#sp-integrations" style={{ color: 'var(--sky)', fontWeight: 600 }}>
              Settings → Integrations
            </Link>{' '}
            {!planAllowsOwnerRezSync(plan)
              ? 'and upgrade to Growth or higher to use OwnerRez with GeoWaypoint.'
              : 'to show connection tools and property mapping on this page.'}
          </p>
        </section>
      )}

      <section className="card" style={{ padding: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          GeoWaypoint API key
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          Server-to-server key for analytics exports, provisioning, and advanced automation. Never expose it in the
          browser or in embed snippets.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <Button type="button" variant="outline" onClick={() => setApiHelpOpen(true)}>
            What is this?
          </Button>
        </div>
        {apiHelpOpen ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 16,
              border: '1px solid var(--border)',
              background: 'var(--fog)',
            }}
          >
            <h3 className="font-serif-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
              GeoWaypoint API access
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55, marginTop: 0 }}>
              The live secret key lets your backend call GeoWaypoint REST endpoints (events, maps, quotes) without a
              user session. It is intended for Pro-tier and higher operators who run their own servers or middleware.
              Rotate the key if it is ever committed to source control or sent over insecure channels.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55 }}>
              <strong>How to connect:</strong> store the key in a secret manager, pass it as a Bearer or configured
              header from your server only, and call the same <code className="gw-code">/api</code> base URL as your
              dashboard. OwnerRez guest checkout continues to use the OwnerRez OAuth token separately.
            </p>
            <Button type="button" variant="outline" onClick={() => setApiHelpOpen(false)}>
              Close
            </Button>
          </div>
        ) : null}
        <pre
          className="gw-code"
          style={{
            marginTop: 14,
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
          {apiAllowed ? (
            <>
              <Button variant="outline" disabled title="Key issuance is not enabled in this build yet.">
                Copy key
              </Button>
              <Button variant="outline" disabled title="Key issuance is not enabled in this build yet.">
                Rotate
              </Button>
            </>
          ) : (
            <PlanGateTooltip
              gated
              title="Pro-tier API access"
              reason="Full API keys and rotation are included on Pro, Resort, and Enterprise so you can automate maps and reporting from your own infrastructure."
            >
              <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="outline" disabled>
                  Copy key
                </Button>
                <Button variant="outline" disabled>
                  Rotate
                </Button>
              </span>
            </PlanGateTooltip>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 16, marginBottom: 0 }}>
          Key issuance is not enabled in this build — controls above show how the flow will look on a paid tier. See{' '}
          <Link href="/help#help-plans" style={{ color: 'var(--sky)', fontWeight: 600 }}>
            Help → Plans
          </Link>{' '}
          for limits.
        </p>
      </section>
    </div>
  );
}

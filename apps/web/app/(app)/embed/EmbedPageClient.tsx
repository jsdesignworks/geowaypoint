'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

export function EmbedPageClient({
  snippet,
  publicBase,
  webhookStatus,
}: {
  snippet: string;
  publicBase: string;
  webhookStatus: string;
}) {
  const [copied, setCopied] = useState(false);

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
      <p style={{ color: 'var(--ink3)', margin: 0 }}>
        Public embed resolution: <code>GET {publicBase}/api/embed/[slug]/[mapId]</code> returns JSON for published
        maps only; <code>403</code> if unpublished, <code>404</code> if unknown (spec §11).
      </p>

      <section className="card" style={{ padding: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Install snippet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
          Host <code>embed.min.js</code> on Cloudflare Pages (or your CDN). Set <code>data-api-base</code> to this
          app origin if the script is served from another domain.
        </p>
        <pre
          style={{
            padding: 16,
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            overflow: 'auto',
            background: 'var(--fog)',
            borderRadius: 'var(--r8)',
          }}
        >
          {snippet}
        </pre>
        <Button variant="primary" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy snippet'}
        </Button>
      </section>

      <section className="card" style={{ padding: 20 }} id="webhooks">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          Webhook health
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          OwnerRez webhook endpoint status (stub until Edge Function is deployed).
        </p>
        <div className="pill pill-gray" style={{ display: 'inline-block', marginTop: 8 }}>
          {webhookStatus}
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} id="ownerrez-connect">
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
          OwnerRez connect
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
          OAuth + token storage in <code>ownerrez_tokens</code> (spec §15) — wire the Edge Function callback URL
          here when ready.
        </p>
        <Button variant="outline" disabled>
          Connect OwnerRez (coming soon)
        </Button>
      </section>
    </div>
  );
}

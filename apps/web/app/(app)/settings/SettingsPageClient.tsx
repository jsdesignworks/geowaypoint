'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { createBillingPortalSession } from '@/app/actions/stripePortal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OwnerRezConnectModal } from '@/components/ownerrez/OwnerRezConnectModal';
import { ProfileClient } from '@/app/(app)/profile/ProfileClient';
import { planAllowsApiAccess, planAllowsOwnerRezSync, planAllowsWidgetAdvanced } from '@/lib/plan';
import { PlanGateTooltip } from '@/components/ui/PlanGateTooltip';

type ResortRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  logo_url: string | null;
  plan: string;
  ownerrez_integration_enabled: boolean | null;
};

type TeamRow = { id: string; user_id: string; role: string; invited_at: string; accepted_at: string | null };

export function SettingsPageClient({
  resort,
  team,
  appOrigin,
  userEmail,
  initialFullName,
}: {
  resort: ResortRow;
  team: TeamRow[];
  appOrigin: string;
  userEmail: string;
  initialFullName: string;
}) {
  const searchParams = useSearchParams();
  const [orOpen, setOrOpen] = useState(false);
  const [ownerRezIntegration, setOwnerRezIntegration] = useState(!!resort.ownerrez_integration_enabled);
  const [name, setName] = useState(resort.name);
  const [slug, setSlug] = useState(resort.slug);
  const [phone, setPhone] = useState(resort.phone ?? '');
  const [accent, setAccent] = useState('#2D6B42');
  const [embedH, setEmbedH] = useState(520);
  const [btnLabel, setBtnLabel] = useState('Book');
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifSync, setNotifSync] = useState(true);
  const [notifWh, setNotifWh] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [notifReceipt, setNotifReceipt] = useState(true);
  const [apiKey] = useState(() => `gw_live_sk_${'•'.repeat(24)}`);

  function copyApiKey() {
    void navigator.clipboard.writeText(apiKey);
    toast('Key copied (masked preview only)', 'success');
  }

  async function saveResortProfile() {
    const supabase = createClient();
    const { error } = await supabase
      .from('resorts')
      .update({ name, slug, phone: phone || null })
      .eq('id', resort.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Resort profile saved', 'success');
  }

  async function saveOwnerRezIntegration(next: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('resorts')
      .update({ ownerrez_integration_enabled: next })
      .eq('id', resort.id);
    if (error) {
      toast(error.message, 'error');
      setOwnerRezIntegration(!next);
      return;
    }
    toast(next ? 'OwnerRez integration enabled' : 'OwnerRez integration disabled', 'success');
  }

  async function openPortal() {
    const res = await createBillingPortalSession();
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    window.location.href = res.url;
  }

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash || hash.length < 2) {
      return;
    }
    const id = hash.slice(1).split('?')[0];
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    const or = searchParams.get('or');
    if (!or) {
      return;
    }
    if (or === 'connected') {
      toast('OwnerRez connected successfully.', 'success');
    } else if (or === 'denied' || or === 'state') {
      toast('OwnerRez authorization was cancelled or timed out.', 'error');
    } else if (or === 'plan' || or === 'disabled') {
      toast('Turn on OwnerRez under Integrations and use a Growth+ plan to connect.', 'error');
    } else if (or === 'token' || or === 'db' || or === 'config') {
      const detail = searchParams.get('detail');
      toast(detail ? `OwnerRez: ${decodeURIComponent(detail)}` : 'OwnerRez connection failed.', 'error');
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('or');
    url.searchParams.delete('detail');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, [searchParams]);

  const navResort = [
    { id: 'sp-profile', title: 'Resort Profile' },
    { id: 'sp-widget', title: 'Widget Appearance' },
    { id: 'sp-integrations', title: 'Integrations' },
  ];
  const navAccount = [
    { id: 'sp-user-profile', title: 'My profile' },
    { id: 'sp-billing', title: 'Billing & Plan' },
    { id: 'sp-team', title: 'Team Members' },
    { id: 'sp-api', title: 'API & Security' },
    { id: 'sp-notifications', title: 'Notifications' },
  ];

  const navLinkStyle: CSSProperties = {
    display: 'block',
    padding: '6px 8px',
    fontSize: 13,
    color: 'var(--sky)',
    textDecoration: 'none',
    borderRadius: 'var(--r4)',
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <OwnerRezConnectModal open={orOpen} onClose={() => setOrOpen(false)} />
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        <nav className="card" style={{ padding: 14, position: 'sticky', top: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--ink3)',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            ACCOUNT
          </div>
          {navAccount.map((p) => (
            <a key={p.id} href={`#${p.id}`} style={navLinkStyle}>
              {p.title}
            </a>
          ))}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--ink3)',
              letterSpacing: '0.06em',
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            RESORT
          </div>
          {navResort.map((p) => (
            <a key={p.id} href={`#${p.id}`} style={navLinkStyle}>
              {p.title}
            </a>
          ))}
        </nav>
        <div style={{ display: 'grid', gap: 16 }}>
          <section className="card" style={{ padding: 20 }} id="sp-user-profile">
            <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
              My profile
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0, lineHeight: 1.5 }}>
              Personal name, password, and sessions. You can also open this section from your user block at the
              bottom of the sidebar.
            </p>
            <ProfileClient email={userEmail} initialFullName={initialFullName} resortName={resort.name} />
          </section>

        <section className="card" style={{ padding: 20 }} id="sp-profile">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Resort Profile
          </h2>
          <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Resort name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <label style={{ fontSize: 11, fontWeight: 600 }}>Public slug</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                {appOrigin.replace(/\/$/, '')}/embed/
              </span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
              <span style={{ fontSize: 13, color: 'var(--ink3)' }}>/[map-id]</span>
            </div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label style={{ fontSize: 11, fontWeight: 600 }}>Logo</label>
            <div
              className="card"
              style={{
                padding: 24,
                borderStyle: 'dashed',
                borderColor: 'var(--border2)',
                textAlign: 'center',
                color: 'var(--ink3)',
                fontSize: 13,
                background: 'var(--fog)',
              }}
            >
              {resort.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resort.logo_url} alt="" style={{ maxHeight: 64, marginBottom: 8 }} />
              ) : (
                <div style={{ fontSize: 12, marginBottom: 8 }}>No logo uploaded</div>
              )}
              <Button type="button" variant="outline" disabled style={{ marginTop: 4 }}>
                Upload logo
              </Button>
              <p style={{ fontSize: 11, margin: '10px 0 0', lineHeight: 1.4 }}>
                PNG or JPG, square works best. Upload will be available in a future release.
              </p>
            </div>
            <Button variant="primary" onClick={() => void saveResortProfile()}>
              Save profile
            </Button>
          </div>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-widget">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Widget Appearance
          </h2>
          <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Accent color</label>
            <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
            <label style={{ fontSize: 11, fontWeight: 600 }}>Default embed height (px)</label>
            <Input type="number" value={embedH} onChange={(e) => setEmbedH(Number(e.target.value))} />
            <label style={{ fontSize: 11, fontWeight: 600 }}>Book button label</label>
            <Input value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} />
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>
              Theme (light / dark / auto), popup style, and button color pickers will apply to the guest widget when
              branding options roll out.
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '12px 0 0', lineHeight: 1.45 }}>
              <strong>Guest site layout</strong> (floating popup vs side panel for site details) is set{' '}
              <strong>per map</strong> in the editor: open{' '}
              <Link href="/maps" style={{ color: 'var(--sky)' }}>
                Maps
              </Link>
              , choose a map, then use the guest layout control in the editor toolbar.
            </p>
            {planAllowsWidgetAdvanced(resort.plan) ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <Button type="button" variant="outline">
                  Light
                </Button>
                <Button type="button" variant="outline">
                  Dark
                </Button>
                <Button type="button" variant="outline">
                  Auto
                </Button>
              </div>
            ) : (
              <PlanGateTooltip
                gated
                title="Growth plan or higher"
                reason="Theme presets for the guest widget unlock on Growth so you can match light/dark booking UI to your site."
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <Button type="button" variant="outline" disabled>
                    Light
                  </Button>
                  <Button type="button" variant="outline" disabled>
                    Dark
                  </Button>
                  <Button type="button" variant="outline" disabled>
                    Auto
                  </Button>
                </div>
              </PlanGateTooltip>
            )}
            <label style={{ fontSize: 11, fontWeight: 600, marginTop: 12 }}>Button color</label>
            {planAllowsWidgetAdvanced(resort.plan) ? (
              <Input type="color" defaultValue="#2D6B42" style={{ maxWidth: 120 }} />
            ) : (
              <PlanGateTooltip
                gated
                title="Growth plan or higher"
                reason="Custom book-button colors apply to the guest embed on Growth+."
              >
                <Input type="color" defaultValue="#2D6B42" disabled style={{ maxWidth: 120 }} />
              </PlanGateTooltip>
            )}
          </div>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-integrations">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Integrations
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 0 }}>
            Enable third-party connections for your resort. When OwnerRez is on, the Embed page and booking handoff use
            your OwnerRez account.
          </p>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 'var(--r8)',
              background: 'var(--fog)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>OwnerRez</div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={ownerRezIntegration}
                disabled={!planAllowsOwnerRezSync(resort.plan) && !ownerRezIntegration}
                onChange={async (e) => {
                  const next = e.target.checked;
                  if (next && !planAllowsOwnerRezSync(resort.plan)) {
                    return;
                  }
                  setOwnerRezIntegration(next);
                  await saveOwnerRezIntegration(next);
                }}
                style={{ marginTop: 3 }}
              />
              <span>
                Show OwnerRez on the Embed page and allow OAuth connection for this resort.
                {!planAllowsOwnerRezSync(resort.plan) ? (
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>
                    Upgrade to Growth or higher to enable OwnerRez sync.{' '}
                    <Link href="/help#help-plans" style={{ color: 'var(--sky)', fontWeight: 600 }}>
                      Compare plans
                    </Link>
                  </span>
                ) : null}
              </span>
            </label>
          </div>

          {ownerRezIntegration && planAllowsOwnerRezSync(resort.plan) ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 16 }}>
                When connected, GeoWaypoint stores your OwnerRez authorization securely. Add this webhook URL in your
                OwnerRez developer settings:
              </p>
              <pre className="gw-code gw-code-block" style={{ marginTop: 8 }}>
                {`${appOrigin.replace(/\/$/, '')}/api/webhooks/ownerrez`}
              </pre>
              <p style={{ fontSize: 12, color: 'var(--ink3)' }}>
                Configure HTTP Basic auth in OwnerRez using the webhook user and password from your server environment
                variables.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <Button variant="primary" onClick={() => setOrOpen(true)}>
                  Connect OwnerRez
                </Button>
                <a className="btn btn-outline" href="/api/oauth/ownerrez/authorize">
                  Start OAuth
                </a>
              </div>
              <div
                className="card"
                style={{
                  marginTop: 16,
                  padding: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--fog)',
                }}
              >
                <h3 className="font-serif-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
                  OAuth scopes (keep minimal)
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55, marginTop: 0 }}>
                  When you register the GeoWaypoint OAuth app in OwnerRez, request only what booking handoff needs—see
                  the official guide:{' '}
                  <a
                    href="https://www.ownerrez.com/support/articles/api-oauth-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--sky)', fontWeight: 600 }}
                  >
                    OwnerRez API OAuth app
                  </a>
                  . Typical GeoWaypoint usage: read property/site metadata and create quotes or payment links—not full
                  account admin.
                </p>
                <ul style={{ fontSize: 13, color: 'var(--ink2)', margin: '0 0 0 1.1rem', lineHeight: 1.55 }}>
                  <li>Prefer read access to properties/units aligned to mapped sites.</li>
                  <li>Include quote or booking endpoints only if you use checkout from the guest map.</li>
                </ul>
              </div>
              <div
                className="card"
                style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)', background: 'var(--fog)' }}
              >
                <h3 className="font-serif-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
                  Webhook health
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--amber)',
                    }}
                  />
                  <span style={{ fontSize: 13 }}>Waiting for first delivery — webhook receiver is active</span>
                </div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 6 }}>Event</th>
                      <th style={{ padding: 6 }}>Status</th>
                      <th style={{ padding: 6 }}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} style={{ padding: 8, color: 'var(--ink3)' }}>
                        No deliveries recorded yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
                <PlanGateTooltip
                  gated
                  title="Coming soon"
                  reason="Test webhook delivery will be available in a future release."
                  helpHref="/help#help-embed"
                >
                  <Button variant="outline" style={{ marginTop: 12 }} disabled>
                    Send test event
                  </Button>
                </PlanGateTooltip>
              </div>
            </>
          ) : ownerRezIntegration && !planAllowsOwnerRezSync(resort.plan) ? (
            <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 16 }}>
              OwnerRez is toggled on, but your plan does not include sync. Upgrade to Growth or higher to finish setup.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 16 }}>
              Turn on OwnerRez above to show connection options and the Embed integration block.
            </p>
          )}
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-billing">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Billing &amp; Plan
          </h2>
          <p style={{ fontSize: 14 }}>
            Current plan: <strong style={{ textTransform: 'capitalize' }}>{resort.plan}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
            Upgrade, change plans, or cancel from the Stripe customer portal. Prices shown are illustrative; your
            subscribed price appears in the portal.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 16,
            }}
          >
            {(
              [
                { slug: 'starter', name: 'Starter', price: 'Free', feats: ['1 map', 'Embed widget', 'Email support'] },
                {
                  slug: 'growth',
                  name: 'Growth',
                  price: 'From $59/mo',
                  feats: ['More maps', 'Analytics', 'CSV export'],
                },
                {
                  slug: 'pro_plus',
                  name: 'Pro+',
                  price: 'Scale up',
                  feats: ['Team seats', 'Priority support', 'API access'],
                },
              ] as const
            ).map((col) => {
              const p = (resort.plan ?? 'starter').toLowerCase();
              const isCurrent =
                col.slug === 'starter'
                  ? p === 'starter'
                  : col.slug === 'growth'
                    ? p === 'growth'
                    : ['pro', 'resort', 'enterprise'].includes(p);
              return (
              <div
                key={col.slug}
                className="card"
                style={{
                  padding: 14,
                  fontSize: 12,
                  border: isCurrent ? '2px solid var(--canopy)' : '1px solid var(--border)',
                }}
              >
                <div className="font-serif-heading" style={{ fontSize: '1rem', marginBottom: 4 }}>
                  {col.name}
                </div>
                <div style={{ color: 'var(--ink3)', marginBottom: 10 }}>{col.price}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink2)', lineHeight: 1.5 }}>
                  {col.feats.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>
          <div
            className="gw-dash-card"
            style={{ marginTop: 16, padding: 14, fontSize: 12, color: 'var(--ink3)' }}
          >
            <strong style={{ color: 'var(--ink)' }}>Payment method</strong>
            <p style={{ margin: '8px 0 0' }}>Cards and invoices are managed in Stripe.</p>
          </div>
          <Button variant="primary" style={{ marginTop: 12 }} onClick={() => void openPortal()}>
            Open billing portal
          </Button>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-team">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Team Members
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 360 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>Member</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 12, color: 'var(--ink3)' }}>
                      No additional members yet. You are the resort owner.
                    </td>
                  </tr>
                ) : (
                  team.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono), monospace', fontSize: 12 }}>
                        {t.user_id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '8px 6px' }}>{t.role}</td>
                      <td style={{ padding: '8px 6px' }}>{t.accepted_at ? 'Active' : 'Pending'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PlanGateTooltip
            gated
            title="Team invites coming soon"
            reason="Multi-user editing and invitations will roll out on Growth+ first."
            helpHref="/help#help-plans"
          >
            <Button variant="outline" disabled style={{ marginTop: 12 }}>
              Invite member
            </Button>
          </PlanGateTooltip>
          <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 8 }}>
            Invitations and roles will be manageable here once team onboarding ships.
          </p>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-api">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            API &amp; Security
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink3)' }}>Secret key for server-side API calls. Never expose in the browser.</p>
          <pre className="gw-code gw-code-block" style={{ wordBreak: 'break-all' }}>
            {apiKey}
          </pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {planAllowsApiAccess(resort.plan) ? (
              <>
                <Button variant="outline" type="button" onClick={() => copyApiKey()}>
                  Copy key
                </Button>
                <Button variant="outline" disabled>
                  Rotate key
                </Button>
              </>
            ) : (
              <PlanGateTooltip
                gated
                title="Pro-tier API access"
                reason="Secret keys and rotation ship with Pro, Resort, and Enterprise so you can call GeoWaypoint from your own servers."
              >
                <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button variant="outline" type="button" disabled>
                    Copy key
                  </Button>
                  <Button variant="outline" disabled>
                    Rotate key
                  </Button>
                </span>
              </PlanGateTooltip>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 8 }}>
            Full key management is not enabled yet — copy shows a masked placeholder.
          </p>
          <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginTop: 16 }}>Allowed origins</label>
          <textarea
            className="rf-input"
            rows={3}
            disabled
            placeholder="https://your-resort-site.com"
            style={{ marginTop: 4, resize: 'vertical' }}
          />
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 16 }}>
            Two-factor authentication and device management use your Supabase Auth account settings.
          </p>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-notifications">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Notifications
          </h2>
          <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
            {(
              [
                ['Booking requests', 'When a guest requests a booking from the map.', notifBooking, setNotifBooking],
                ['OwnerRez sync', 'When property data finishes syncing from OwnerRez.', notifSync, setNotifSync],
                ['Webhook failures', 'When OwnerRez webhook delivery fails.', notifWh, setNotifWh],
                ['Weekly digest', 'Summary of map views and clicks.', notifDigest, setNotifDigest],
                ['Billing receipts', 'Stripe invoices and payment confirmations.', notifReceipt, setNotifReceipt],
              ] as [string, string, boolean, Dispatch<SetStateAction<boolean>>][]
            ).map(([title, desc, on, set]) => (
              <div key={title} style={{ display: 'grid', gap: 4 }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => set(e.target.checked)}
                  />
                  {title}
                </label>
                <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '0 0 0 28px' }}>{desc}</p>
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0 }}>
              These toggles are saved in this browser for now; server-side preferences are coming soon.
            </p>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

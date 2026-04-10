'use client';

import { useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { createBillingPortalSession } from '@/app/actions/stripePortal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OwnerRezConnectModal } from '@/components/ownerrez/OwnerRezConnectModal';

type ResortRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  logo_url: string | null;
  plan: string;
};

type TeamRow = { id: string; user_id: string; role: string; invited_at: string; accepted_at: string | null };

export function SettingsPageClient({
  resort,
  team,
  appOrigin,
}: {
  resort: ResortRow;
  team: TeamRow[];
  appOrigin: string;
}) {
  const [orOpen, setOrOpen] = useState(false);
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

  async function openPortal() {
    const res = await createBillingPortalSession();
    if ('error' in res) {
      toast(res.error, 'error');
      return;
    }
    window.location.href = res.url;
  }

  const navResort = [
    { id: 'sp-profile', title: 'Resort Profile' },
    { id: 'sp-widget', title: 'Widget Appearance' },
    { id: 'sp-ownerrez', title: 'OwnerRez' },
  ];
  const navAccount = [
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
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
      <OwnerRezConnectModal open={orOpen} onClose={() => setOrOpen(false)} />
      <nav className="card" style={{ padding: 14, position: 'sticky', top: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '0.06em', marginBottom: 6 }}>
          RESORT
        </div>
        {navResort.map((p) => (
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
          ACCOUNT
        </div>
        {navAccount.map((p) => (
          <a key={p.id} href={`#${p.id}`} style={navLinkStyle}>
            {p.title}
          </a>
        ))}
      </nav>
      <div style={{ display: 'grid', gap: 16 }}>
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
            <label style={{ fontSize: 11, fontWeight: 600, marginTop: 12 }}>Button color</label>
            <Input type="color" defaultValue="#2D6B42" disabled style={{ maxWidth: 120 }} />
          </div>
        </section>

        <section className="card" style={{ padding: 20 }} id="sp-ownerrez">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.15rem' }}>
            OwnerRez
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
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
            <Button variant="outline" style={{ marginTop: 12 }} disabled>
              Send test event
            </Button>
          </div>
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
          <Button variant="outline" disabled style={{ marginTop: 12 }}>
            Invite member
          </Button>
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
            <Button variant="outline" type="button" onClick={() => copyApiKey()}>
              Copy key
            </Button>
            <Button variant="outline" disabled>
              Rotate key
            </Button>
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
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SECTION_IDS = ['help-embed', 'help-maps', 'help-plans', 'help-billing', 'help-account'] as const;

const NAV: { id: (typeof SECTION_IDS)[number]; label: string }[] = [
  { id: 'help-embed', label: 'Embed & guest map' },
  { id: 'help-maps', label: 'Maps & editor' },
  { id: 'help-plans', label: 'Plans & upgrades' },
  { id: 'help-billing', label: 'Billing & plans' },
  { id: 'help-account', label: 'Account & security' },
];

export function HelpPageClient() {
  const [active, setActive] = useState<string>(SECTION_IDS[0]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            setActive(e.target.id);
          }
        }
      },
      { root: null, rootMargin: '-12% 0px -50% 0px', threshold: [0, 0.1, 0.25] }
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) {
        obs.observe(el);
      }
    }
    return () => obs.disconnect();
  }, []);

  const navLink = (id: string, _label: string, isActive: boolean) => ({
    display: 'block' as const,
    padding: '8px 10px',
    fontSize: 13,
    color: isActive ? 'var(--canopy)' : 'var(--sky)',
    textDecoration: 'none' as const,
    borderRadius: 'var(--r4)',
    fontWeight: isActive ? 700 : 500,
    background: isActive ? 'var(--fog)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--canopy)' : '3px solid transparent',
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 240px) 1fr',
        gap: 24,
        alignItems: 'start',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <nav className="card" style={{ padding: 14, position: 'sticky', top: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '0.06em', marginBottom: 8 }}>
          TOPICS
        </div>
        {NAV.map(({ id, label }) => (
          <a key={id} href={`#${id}`} style={navLink(id, label, active === id)}>
            {label}
          </a>
        ))}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <Link href="/settings" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            Open Settings
          </Link>
        </div>
      </nav>

      <div style={{ display: 'grid', gap: 20 }}>
        <header>
          <h1 className="font-serif-heading" style={{ margin: 0, fontSize: '1.75rem' }}>
            Help center
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Quick answers for GeoWaypoint. For spec-level behavior, use your internal build spec; this page is the
            operator-facing overview.
          </p>
        </header>

        <article className="card" style={{ padding: 22 }} id="help-embed">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.2rem' }}>
            Embed &amp; guest map
          </h2>
          <ul style={{ margin: '0 0 0 1.1rem', padding: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink2)' }}>
            <li>
              Copy the embed snippet from <Link href="/embed">Embed &amp; API</Link>. You need your resort slug and map
              ID on the container element. Optional <code className="gw-code">data-show-*</code> attributes hide the
              header, filters, compare bar, footer, or book button.
            </li>
            <li>
              Published maps only appear to guests. Use <strong>Preview</strong> from the map row or editor to test
              before publishing.
            </li>
            <li>
              Status filters in the guest header limit which markers are shown. Site details can use a floating card
              or a side panel depending on the map&apos;s guest layout setting in the editor.
            </li>
            <li>
              Booking uses OwnerRez when properties are linked; enable OwnerRez under{' '}
              <Link href="/settings#sp-integrations">Settings → Integrations</Link> first.
            </li>
          </ul>
        </article>

        <article className="card" style={{ padding: 22 }} id="help-maps">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.2rem' }}>
            Maps &amp; editor
          </h2>
          <ul style={{ margin: '0 0 0 1.1rem', padding: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink2)' }}>
            <li>
              Upload a map image on <Link href="/maps">Maps</Link>, then open the editor to place sites and set
              display codes, rates, and status.
            </li>
            <li>
              Use <strong>Shift+click</strong> (or compare mode) to select multiple sites for comparison when that mode
              is enabled on the guest map.
            </li>
            <li>
              OwnerRez property IDs are set per site in the editor so quotes and checkout hand off to the correct
              property.
            </li>
          </ul>
        </article>

        <article className="card" style={{ padding: 22 }} id="help-plans">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.2rem' }}>
            Plans &amp; upgrades
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.6, marginTop: 0 }}>
            Each tier unlocks more maps, sites, analytics, and integrations. Upgrade when you need deeper guest
            insights, CSV export, OwnerRez sync, or API automation.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14,
              marginTop: 16,
            }}
          >
            {(
              [
                {
                  name: 'Starter',
                  price: 'Entry',
                  bullets: ['1 map', 'Up to 30 sites', 'Embed widget', 'Layout exploration'],
                },
                {
                  name: 'Growth',
                  price: 'Scale',
                  bullets: ['More maps & sites', 'Analytics + CSV', 'OwnerRez integration', 'Theme controls'],
                },
                {
                  name: 'Pro+',
                  price: 'Automation',
                  bullets: ['Higher site caps', 'Team-ready', 'API keys (roadmap)', 'Priority workflows'],
                },
              ] as const
            ).map((tier) => (
              <div
                key={tier.name}
                className="card"
                style={{
                  padding: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--white)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div className="font-serif-heading" style={{ fontSize: '1.05rem', margin: 0 }}>
                  {tier.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600 }}>{tier.price}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
                  {tier.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 0, marginTop: 16 }}>
            Change your subscription from{' '}
            <Link href="/settings#sp-billing" style={{ color: 'var(--sky)', fontWeight: 600 }}>
              Settings → Billing &amp; Plan
            </Link>
            . Tooltips on locked features link here for the full comparison.
          </p>
        </article>

        <article className="card" style={{ padding: 22 }} id="help-billing">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.2rem' }}>
            Billing &amp; plans
          </h2>
          <ul style={{ margin: '0 0 0 1.1rem', padding: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink2)' }}>
            <li>
              Open the Stripe customer portal from <Link href="/settings#sp-billing">Settings → Billing &amp; Plan</Link>{' '}
              to change subscription or payment method.
            </li>
            <li>
              Starter vs paid tiers control analytics depth, map limits, and embed branding options per your plan
              matrix.
            </li>
          </ul>
        </article>

        <article className="card" style={{ padding: 22 }} id="help-account">
          <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.2rem' }}>
            Account &amp; security
          </h2>
          <ul style={{ margin: '0 0 0 1.1rem', padding: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink2)' }}>
            <li>
              Personal name, password, and sessions live under{' '}
              <Link href="/settings#sp-user-profile">Settings → My profile</Link> (same content as the legacy profile
              area).
            </li>
            <li>
              Resort profile, team, API keys, and notifications are grouped in Settings sections for faster scanning.
            </li>
            <li>Sign out from the bottom of the sidebar; you will be asked to confirm before the session ends.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}

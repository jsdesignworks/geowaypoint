const PANELS = [
  { id: 'sp-account', title: 'Account', body: 'Resort name, contact, and region (spec §12).' },
  { id: 'sp-billing', title: 'Billing & plans', body: 'Stripe portal, invoices, plan changes.' },
  { id: 'sp-team', title: 'Team', body: 'Invite editors via team_members; roles per spec.' },
  { id: 'sp-api', title: 'API & security', body: 'Rotate keys, embed domains, rate limits.' },
  { id: 'sp-notifications', title: 'Notifications', body: 'Email preferences and alert types.' },
  { id: 'sp-ownerrez', title: 'OwnerRez', body: 'Connection status, sync, property defaults.' },
  { id: 'sp-general', title: 'General', body: 'Locale, units, branding defaults.' },
];

export default function SettingsPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
      <nav className="card" style={{ padding: 12, position: 'sticky', top: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', marginBottom: 8 }}>Jump to</div>
        {PANELS.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            style={{
              display: 'block',
              padding: '6px 8px',
              fontSize: 13,
              color: 'var(--sky)',
              textDecoration: 'none',
              borderRadius: 6,
            }}
          >
            {p.title}
          </a>
        ))}
      </nav>
      <div style={{ display: 'grid', gap: 16 }}>
        {PANELS.map((p) => (
          <section key={p.id} className="card" style={{ padding: 20 }} id={p.id}>
            <h2 className="font-serif-heading" style={{ fontSize: '1.15rem', marginTop: 0 }}>
              {p.title}
            </h2>
            <p style={{ color: 'var(--ink3)', margin: 0, fontSize: 14 }}>{p.body}</p>
            <p style={{ color: 'var(--ink3)', margin: '12px 0 0', fontSize: 13 }}>
              Full forms and Stripe Customer Portal wiring land with production billing (§12).
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

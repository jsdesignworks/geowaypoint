export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', padding: 32 }}>
      <div className="card" style={{ maxWidth: 720, margin: '0 auto', padding: 28 }}>
        <h1 className="font-serif-heading" style={{ marginTop: 0 }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--ink3)', fontSize: 14 }}>
          Placeholder privacy policy (spec §18). Replace with a policy that covers Supabase Auth, Stripe,
          OwnerRez, Resend, analytics events, and embed data collection.
        </p>
      </div>
    </main>
  );
}

import { createClient } from '@/lib/supabase/server';

export default async function LoyaltyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: resort } = await supabase
    .from('resorts')
    .select('slug, plan')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle();

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  const referral =
    resort?.slug && origin ? `${origin}/signup?ref=${encodeURIComponent(resort.slug)}` : null;

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ color: 'var(--ink3)', fontSize: 14 }}>
        Loyalty &amp; referrals (spec §14): tiers, credits, Stripe + cron automation — schema and jobs ship when
        billing milestones are fixed.
      </p>

      <section className="card" style={{ padding: 20, marginTop: 20 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Your tier
        </h2>
        <div className="pill pill-gray" style={{ display: 'inline-block' }}>
          {resort?.plan ?? 'starter'}
        </div>
      </section>

      <section className="card" style={{ padding: 20, marginTop: 16 }}>
        <h2 className="font-serif-heading" style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Referral link
        </h2>
        {referral ? (
          <>
            <pre
              style={{
                padding: 12,
                fontSize: 12,
                wordBreak: 'break-all',
                background: 'var(--fog)',
                borderRadius: 'var(--r8)',
              }}
            >
              {referral}
            </pre>
            <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 0 }}>
              Wire signup attribution and credit ledger in a follow-up migration (§14).
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
            Set <code>NEXT_PUBLIC_APP_URL</code> to show a copy-ready referral URL.
          </p>
        )}
      </section>
    </div>
  );
}

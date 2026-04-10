'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinInner() {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const ref = sp.get('ref');
    router.replace(ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup');
  }, [sp, router]);
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <p style={{ color: 'var(--ink3)' }}>Redirecting…</p>
    </main>
  );
}

/** Spec §14 — referral landing `https://.../join?ref={slug}` */
export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
          <p style={{ color: 'var(--ink3)' }}>Loading…</p>
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  );
}

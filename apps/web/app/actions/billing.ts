'use server';

import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function attachStripeCustomerIfNeeded(resortId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: true as const, skipped: true as const };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: 'Not signed in' as const };
  }

  const admin = createAdminClient();
  const { data: resort } = await admin
    .from('resorts')
    .select('stripe_customer_id')
    .eq('id', resortId)
    .single();

  if (resort?.stripe_customer_id) {
    return { ok: true as const };
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { resort_id: resortId },
  });

  await admin.from('resorts').update({ stripe_customer_id: customer.id }).eq('id', resortId);

  return { ok: true as const };
}

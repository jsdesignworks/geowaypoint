'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export async function createBillingPortalSession(): Promise<{ url: string } | { error: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'Stripe is not configured' };
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not signed in' };
  }
  const { data: resort } = await supabase
    .from('resorts')
    .select('stripe_customer_id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!resort?.stripe_customer_id) {
    return { error: 'No Stripe customer yet — complete onboarding or contact support.' };
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: resort.stripe_customer_id,
    return_url: `${base}/settings#sp-billing`,
  });
  return { url: session.url };
}

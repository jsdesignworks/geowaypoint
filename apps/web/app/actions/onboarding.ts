'use server';

import { attachStripeCustomerIfNeeded } from '@/app/actions/billing';
import { createClient } from '@/lib/supabase/server';

export async function saveResortDetails(input: { name: string; slug: string; phone: string | null }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: existing } = await supabase
    .from('resorts')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('resorts')
      .update({ name: input.name, slug: input.slug, phone: input.phone })
      .eq('id', existing.id);
    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from('resorts').insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      phone: input.phone,
      plan: 'starter',
    });
    if (error) {
      return { error: error.message };
    }
  }

  return { ok: true };
}

export async function applyPlanChoice(choice: 'starter' | 'pro_trial') {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: resort, error: rErr } = await supabase
    .from('resorts')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (rErr || !resort) {
    return { error: 'Resort not found' };
  }

  if (choice === 'starter') {
    const { error } = await supabase
      .from('resorts')
      .update({ plan: 'starter', trial_ends_at: null })
      .eq('id', resort.id);
    if (error) {
      return { error: error.message };
    }
    return { ok: true };
  }

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);
  const { error } = await supabase
    .from('resorts')
    .update({ plan: 'trial', trial_ends_at: trialEnds.toISOString() })
    .eq('id', resort.id);
  if (error) {
    return { error: error.message };
  }

  const stripe = await attachStripeCustomerIfNeeded(resort.id);
  if ('error' in stripe && stripe.error) {
    return { error: stripe.error };
  }

  return { ok: true };
}

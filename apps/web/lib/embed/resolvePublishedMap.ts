import { createAdminClient } from '@/lib/supabase/admin';
import {
  isTrialExpired,
  planRequiresStripeSubscription,
} from '@/lib/plan';

export type EmbedResolveError =
  | { status: 404; body: { error: string } }
  | { status: 402; body: { error: 'subscription_required' } }
  | { status: 403; body: { error: 'map_not_published' } };

export type GuestSiteDetailMode = 'popup' | 'sidebar';

export type EmbedResolveOk = {
  status: 200;
  body: {
    resort: { slug: string; name: string };
    map: {
      id: string;
      name: string;
      image_url: string | null;
      guest_site_detail_mode: GuestSiteDetailMode;
    };
    sites: unknown[];
  };
};

export async function resolvePublishedMapForEmbed(
  slug: string,
  mapId: string
): Promise<EmbedResolveError | EmbedResolveOk> {
  const admin = createAdminClient();
  const { data: resort } = await admin
    .from('resorts')
    .select('id, slug, name, plan, trial_ends_at, stripe_subscription_id')
    .eq('slug', slug)
    .maybeSingle();

  if (!resort) {
    return { status: 404, body: { error: 'not_found' } };
  }

  if (isTrialExpired(resort.trial_ends_at, resort.plan)) {
    return { status: 402, body: { error: 'subscription_required' } };
  }

  if (
    planRequiresStripeSubscription(resort.plan) &&
    !(resort.stripe_subscription_id && String(resort.stripe_subscription_id).length > 0)
  ) {
    return { status: 402, body: { error: 'subscription_required' } };
  }

  const { data: map } = await admin
    .from('maps')
    .select('id, name, image_url, is_published, resort_id, guest_site_detail_mode')
    .eq('id', mapId)
    .maybeSingle();

  if (!map || map.resort_id !== resort.id) {
    return { status: 404, body: { error: 'not_found' } };
  }

  if (!map.is_published) {
    return { status: 403, body: { error: 'map_not_published' } };
  }

  const { data: sites } = await admin
    .from('sites')
    .select(
      'id, name, display_code, site_type, status, rate_night, max_length_ft, description, photo_url, pos_x, pos_y, ownerrez_property_id'
    )
    .eq('map_id', map.id);

  const mode =
    (map as { guest_site_detail_mode?: string | null }).guest_site_detail_mode === 'sidebar'
      ? 'sidebar'
      : 'popup';

  return {
    status: 200,
    body: {
      resort: { slug: resort.slug, name: resort.name },
      map: {
        id: map.id,
        name: map.name,
        image_url: map.image_url,
        guest_site_detail_mode: mode,
      },
      sites: sites ?? [],
    },
  };
}

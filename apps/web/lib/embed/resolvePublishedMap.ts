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

type MapRowForEmbed = {
  id: string;
  name: string;
  image_url: string | null;
  is_published: boolean | null;
  resort_id: string;
  guest_site_detail_mode?: string | null;
};

function isMissingGuestDetailColumnError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('guest_site_detail_mode') &&
    (m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find'))
  );
}

async function loadMapRowForEmbed(
  admin: ReturnType<typeof createAdminClient>,
  mapId: string
): Promise<MapRowForEmbed | null> {
  const full = await admin
    .from('maps')
    .select('id, name, image_url, is_published, resort_id, guest_site_detail_mode')
    .eq('id', mapId)
    .maybeSingle();

  if (!full.error && full.data) {
    return full.data as MapRowForEmbed;
  }

  if (full.error && isMissingGuestDetailColumnError(full.error.message)) {
    const fallback = await admin
      .from('maps')
      .select('id, name, image_url, is_published, resort_id')
      .eq('id', mapId)
      .maybeSingle();
    if (!fallback.error && fallback.data) {
      return {
        ...(fallback.data as Omit<MapRowForEmbed, 'guest_site_detail_mode'>),
        guest_site_detail_mode: 'popup',
      };
    }
  }

  return null;
}

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

  const map = await loadMapRowForEmbed(admin, mapId);

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

  const mode = map.guest_site_detail_mode === 'sidebar' ? 'sidebar' : 'popup';

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

'use server';

import { createClient } from '@/lib/supabase/server';

type MapCtx =
  | { error: string }
  | { supabase: ReturnType<typeof createClient>; resortId: string };

async function assertMapOwner(mapId: string): Promise<MapCtx> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }
  const { data: map, error: mErr } = await supabase
    .from('maps')
    .select('id, resort_id')
    .eq('id', mapId)
    .single();
  if (mErr || !map) {
    return { error: 'Map not found' };
  }
  const { data: own } = await supabase
    .from('resorts')
    .select('id')
    .eq('id', map.resort_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!own) {
    return { error: 'Forbidden' };
  }
  return { supabase, resortId: map.resort_id };
}

export async function addSite(mapId: string, name: string) {
  const r = await assertMapOwner(mapId);
  if ('error' in r) {
    return r;
  }
  const { data, error } = await r.supabase
    .from('sites')
    .insert({
      map_id: mapId,
      resort_id: r.resortId,
      name,
      pos_x: 50,
      pos_y: 50,
    })
    .select('*')
    .single();
  if (error || !data) {
    return { error: error?.message ?? 'Insert failed' };
  }
  return { ok: true, site: data };
}

export async function updateSite(
  siteId: string,
  patch: Partial<{
    name: string;
    site_type: string | null;
    status: string | null;
    rate_night: number | null;
    max_length_ft: number | null;
    description: string | null;
    ownerrez_property_id: string | null;
    pos_x: number;
    pos_y: number;
  }>
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }
  const { data: site, error: sErr } = await supabase.from('sites').select('id, resort_id').eq('id', siteId).single();
  if (sErr || !site) {
    return { error: 'Site not found' };
  }
  const { data: own } = await supabase
    .from('resorts')
    .select('id')
    .eq('id', site.resort_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!own) {
    return { error: 'Forbidden' };
  }
  const { error } = await supabase.from('sites').update(patch).eq('id', siteId);
  if (error) {
    return { error: error.message || 'Update failed' };
  }
  return { ok: true };
}

export async function deleteSites(siteIds: string[]): Promise<{ ok: true } | { error: string }> {
  if (siteIds.length === 0) {
    return { ok: true };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }
  const { data: sites, error: qErr } = await supabase.from('sites').select('id, resort_id').in('id', siteIds);
  if (qErr || !sites?.length) {
    return { error: 'Nothing to delete' };
  }
  const resortIds = Array.from(new Set(sites.map((s) => s.resort_id)));
  const { data: resorts } = await supabase.from('resorts').select('id').in('id', resortIds).eq('owner_id', user.id);
  if (!resorts?.length) {
    return { error: 'Forbidden' };
  }
  const allowed = new Set(resorts.map((x) => x.id));
  const okIds = sites.filter((s) => allowed.has(s.resort_id)).map((s) => s.id);
  const { error } = await supabase.from('sites').delete().in('id', okIds);
  if (error) {
    return { error: error.message || 'Delete failed' };
  }
  return { ok: true };
}

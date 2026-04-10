'use server';

import { createClient } from '@/lib/supabase/server';
import { maxMapsForPlan } from '@/lib/plan';

type ResortContext =
  | { error: string }
  | { resortId: string; plan: string; supabase: ReturnType<typeof createClient> };

async function getResortId(): Promise<ResortContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }
  const { data: resort, error } = await supabase
    .from('resorts')
    .select('id, plan')
    .eq('owner_id', user.id)
    .single();
  if (error || !resort) {
    return { error: 'No resort' };
  }
  return { resortId: resort.id, plan: resort.plan ?? 'starter', supabase };
}

export async function renameMap(mapId: string, name: string) {
  const r = await getResortId();
  if ('error' in r) {
    return r;
  }
  const { error } = await r.supabase.from('maps').update({ name }).eq('id', mapId);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function toggleMapPublished(mapId: string, isPublished: boolean) {
  const r = await getResortId();
  if ('error' in r) {
    return r;
  }
  const { error } = await r.supabase.from('maps').update({ is_published: isPublished }).eq('id', mapId);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function deleteMap(mapId: string) {
  const r = await getResortId();
  if ('error' in r) {
    return r;
  }
  const { error } = await r.supabase.from('maps').delete().eq('id', mapId);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function updateMapGuestSiteDetailMode(mapId: string, mode: 'popup' | 'sidebar') {
  const r = await getResortId();
  if ('error' in r) {
    return r;
  }
  const { error } = await r.supabase
    .from('maps')
    .update({ guest_site_detail_mode: mode })
    .eq('id', mapId);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}

export async function createMap(name = 'New Map') {
  const r = await getResortId();
  if ('error' in r) {
    return r;
  }
  const maxMaps = maxMapsForPlan(r.plan);
  if (Number.isFinite(maxMaps)) {
    const { count, error: cErr } = await r.supabase
      .from('maps')
      .select('*', { count: 'exact', head: true })
      .eq('resort_id', r.resortId);
    if (!cErr && count !== null && count >= maxMaps) {
      return { error: `Your plan allows ${maxMaps} map(s). Upgrade in Settings.` };
    }
  }
  const { data, error } = await r.supabase
    .from('maps')
    .insert({ resort_id: r.resortId, name })
    .select('id')
    .single();
  if (error || !data) {
    return { error: error?.message ?? 'Insert failed' };
  }
  return { ok: true, id: data.id };
}

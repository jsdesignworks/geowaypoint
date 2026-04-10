import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const meta = user.user_metadata as { onboarding_complete?: boolean; full_name?: string } | undefined;
  if (!meta?.onboarding_complete) {
    redirect('/onboarding');
  }

  const { data: resort } = await supabase
    .from('resorts')
    .select('id, name, plan, trial_ends_at')
    .eq('owner_id', user.id)
    .maybeSingle();

  let mapCount = 0;
  let siteCount = 0;
  if (resort?.id) {
    const { count: mc } = await supabase
      .from('maps')
      .select('id', { count: 'exact', head: true })
      .eq('resort_id', resort.id);
    const { count: sc } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('resort_id', resort.id);
    mapCount = mc ?? 0;
    siteCount = sc ?? 0;
  }

  return (
    <AppShell
      userEmail={user.email ?? ''}
      userDisplayName={meta?.full_name}
      resort={resort}
      mapCount={mapCount}
      siteCount={siteCount}
    >
      {children}
    </AppShell>
  );
}

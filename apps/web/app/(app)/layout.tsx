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

  const meta = user.user_metadata as { onboarding_complete?: boolean } | undefined;
  if (!meta?.onboarding_complete) {
    redirect('/onboarding');
  }

  const { data: resort } = await supabase
    .from('resorts')
    .select('id, name, plan, trial_ends_at')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <AppShell userEmail={user.email ?? ''} resort={resort}>
      {children}
    </AppShell>
  );
}

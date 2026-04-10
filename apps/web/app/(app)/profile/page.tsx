import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from '@/app/(app)/profile/ProfileClient';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <ProfileClient email={user?.email ?? ''} />;
}

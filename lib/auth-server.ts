import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    // In demo mode or when Supabase is not yet configured, allow request
    return {
      id: 'demo-user-1',
      email: 'demo@sarvam.ai',
      user_metadata: { full_name: 'Guest Speaker' },
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

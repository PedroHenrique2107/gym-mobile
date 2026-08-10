import { getSupabaseBrowserClient } from '@/lib/auth/supabase-browser';

export async function getCurrentOwnerId(): Promise<string | null> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  return data.session?.user.id ?? null;
}

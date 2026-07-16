import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED } from '../utils/constants';

// ── Supabase client (null when credentials are not configured) ─────────────
// The app runs fully offline when SUPABASE_CONFIGURED is false.
// Add your project URL and anon key to app.json > extra before building
// for production. The anon (public) key is safe to embed in mobile apps;
// never embed the service-role key.

let _supabase: SupabaseClient | null = null;

if (SUPABASE_CONFIGURED) {
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export const supabase: SupabaseClient = _supabase as SupabaseClient;

// Test connectivity to Supabase (returns false when not configured)
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!SUPABASE_CONFIGURED || !_supabase) return false;
  try {
    const { error } = await _supabase.from('products').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

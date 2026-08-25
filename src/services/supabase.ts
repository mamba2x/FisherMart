import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
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

export const getAuthUid = async (): Promise<string | null> => {
  if (!SUPABASE_CONFIGURED || !_supabase) return null;
  try {
    const { data } = await _supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
};

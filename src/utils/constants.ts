// FisherMart — App-wide constants
import Constants from 'expo-constants';

export const APP_NAME = 'FisherMart';
export const APP_VERSION = '1.0.0';

// ── Supabase ──────────────────────────────────────────────────────────────────
// Values are injected at build time from app.json > extra.
// At runtime: if credentials are absent the app runs fully offline.
// Provide real values in app.json "extra" block before building for production.
const _extra = Constants.expoConfig?.extra ?? {};

export const SUPABASE_URL: string = _extra.supabaseUrl || '';
export const SUPABASE_ANON_KEY: string = _extra.supabaseAnonKey || '';

/** True when valid Supabase credentials are present in the build. */
export const SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

// ── Sync ──────────────────────────────────────────────────────────────────────
export const SYNC_RETRY_INTERVAL_MS = 30_000; // 30 seconds
export const SYNC_BATCH_SIZE = 50;

// ── DB ────────────────────────────────────────────────────────────────────────
export const DB_NAME = 'fishermart.db';
export const DB_VERSION = 1;

// ── Fishers in Delta State ─────────────────────────────────────────────────────
export const DELTA_STATE_ZONES = [
  'Warri',
  'Burutu',
  'Bomadi',
  'Patani',
  'Isoko North',
  'Isoko South',
  'Ughelli North',
  'Ughelli South',
  'Ukwuani',
  'Ndokwa East',
  'Ndokwa West',
  'Okpe',
  'Sapele',
  'Ethiope East',
  'Ethiope West',
  'Other',
] as const;

export const FISH_UNITS = ['kg', 'g', 'pieces', 'baskets', 'crates', 'bags'] as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;

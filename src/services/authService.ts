// FisherMart — Auth Service
// Handles local authentication using AsyncStorage
// Integrates with Supabase Anonymous Authentication for RLS identity

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../database/db';
import { supabase } from './supabase';
import { SUPABASE_CONFIGURED } from '../utils/constants';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const AUTH_SESSION_KEY = '@fishermart_session';
const PROFILE_KEY = '@fishermart_profile';

export interface FisherProfile {
  id: string;
  owner_id: string;
  auth_pending: boolean;
  name: string;
  phone: string;
  zone: string;
  boat_number: string;
  village?: string;
  created_at: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  profile: FisherProfile | null;
}

// ── Get Supabase auth.uid() ────────────────────────────────────────────────
export const getAuthUid = async (): Promise<string | null> => {
  if (!SUPABASE_CONFIGURED || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
};

// ── Get current owner ID (either real auth.uid() or temporary UUID) ────────
export const getOwnerIdFromAuth = async (): Promise<string> => {
  const uid = await getAuthUid();
  if (uid) return uid;

  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  if (saved) {
    const profile: FisherProfile = JSON.parse(saved);
    if (profile.owner_id) return profile.owner_id;
  }

  throw new Error(
    'No registered fisher identity found. Complete registration before creating records.'
  );
};

// ── Migrate temporary owner ID to real Supabase auth.uid() atomically ─────
export const migrateTemporaryOwnerId = async (
  tempId: string,
  realUid: string
): Promise<boolean> => {
  const db = await getDb();
  console.log(`Starting atomic migration of owner ID: ${tempId} -> ${realUid}`);

  try {
    // Start SQLite transaction
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Update SQLite tables
    await db.runAsync(`UPDATE products SET owner_id = ? WHERE owner_id = ?`, [realUid, tempId]);
    await db.runAsync(`UPDATE orders SET owner_id = ? WHERE owner_id = ?`, [realUid, tempId]);
    await db.runAsync(`UPDATE orders SET seller_id = ? WHERE seller_id = ?`, [realUid, tempId]);

    // 2. Update affected sync_queue payloads (replace temp ID in JSON strings)
    const rows = await db.getAllAsync<any>(`SELECT id, payload FROM sync_queue`);
    for (const row of rows) {
      if (row.payload && row.payload.includes(tempId)) {
        const updatedPayload = row.payload.replace(new RegExp(tempId, 'g'), realUid);
        await db.runAsync(`UPDATE sync_queue SET payload = ? WHERE id = ?`, [updatedPayload, row.id]);
      }
    }

    // Commit SQLite transaction
    await db.execAsync('COMMIT;');

    // 3. Update AsyncStorage profile and settings (only after transaction commits successfully)
    const saved = await AsyncStorage.getItem(PROFILE_KEY);
    if (saved) {
      const profile: FisherProfile = JSON.parse(saved);
      profile.owner_id = realUid;
      profile.auth_pending = false;
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

      const session = await getSession();
      if (session.isLoggedIn) {
        session.profile = profile;
        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      }
    }

    await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['fisher_owner_id', realUid]);
    await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['auth_pending', 'false']);

    console.log('Ownership migration completed successfully.');
    return true;
  } catch (err) {
    console.error('Migration failed. Rolling back SQLite changes:', err);
    try {
      await db.execAsync('ROLLBACK;');
    } catch (e) {
      console.error('Rollback failed:', e);
    }
    return false;
  }
};

// ── Ensure an authenticated anonymous session exists ──────────────────────
export const ensureAnonymousSession = async (): Promise<string | null> => {
  if (!SUPABASE_CONFIGURED || !supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    let uid = session?.user?.id ?? null;

    if (!uid) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      uid = data.session?.user?.id ?? data.user?.id ?? null;
      if (!uid) throw new Error('Anonymous sign-in did not return a user ID');
    }

    // Check if we need to migrate a temporary owner ID
    const saved = await AsyncStorage.getItem(PROFILE_KEY);
    if (saved) {
      const profile: FisherProfile = JSON.parse(saved);
      if (profile.auth_pending && profile.owner_id) {
        const tempId = profile.owner_id;
        const migrationSuccess = await migrateTemporaryOwnerId(tempId, uid);
        if (!migrationSuccess) {
          throw new Error('Atomic owner ID migration failed');
        }
      }

      // Upsert profile row directly to Supabase
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: uid,
        name: profile.name,
        phone: profile.phone,
        zone: profile.zone,
        village: profile.village || null,
        boat_number: profile.boat_number || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('Failed to sync profile to Supabase:', profileError.message);
      }
    }

    return uid;
  } catch (e) {
    console.error('ensureAnonymousSession failed:', e);
    return null;
  }
};

// ── Register a new fisher account ─────────────────────────────────────────
export const registerFisher = async (
  profile: Omit<FisherProfile, 'id' | 'owner_id' | 'auth_pending' | 'created_at'>
): Promise<FisherProfile> => {
  const id = `fisher_${Date.now()}`;
  const owner_id = uuidv4(); // Generate stable temporary owner UUID
  const now = new Date().toISOString();

  const newProfile: FisherProfile = {
    ...profile,
    id,
    owner_id,
    auth_pending: true,
    created_at: now,
  };

  // Save profile to AsyncStorage
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));

  // Save session
  const session: AuthSession = { isLoggedIn: true, profile: newProfile };
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

  // Persist values to settings table
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['fisher_name', newProfile.name]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['fisher_phone', newProfile.phone]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['fisher_zone', newProfile.zone]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['fisher_owner_id', newProfile.owner_id]
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['auth_pending', 'true']
  );

  // If online, immediately call ensureAnonymousSession in the background
  if (SUPABASE_CONFIGURED) {
    ensureAnonymousSession().catch((e) => {
      console.log('Background session setup failed (will retry on next sync):', e);
    });
  }

  return newProfile;
};

// ── Login ──────────────────────────────────────────────────────────────────
export const loginFisher = async (
  name: string,
  phone: string
): Promise<{ success: boolean; profile?: FisherProfile; error?: string }> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  if (!saved) {
    return { success: false, error: 'No account found. Please register first.' };
  }

  const profile: FisherProfile = JSON.parse(saved);

  // Check name + phone last 4 digits matching
  const storedLast4 = profile.phone.slice(-4);
  const inputLast4 = phone.trim().slice(-4);

  if (
    profile.name.toLowerCase().trim() !== name.toLowerCase().trim() ||
    storedLast4 !== inputLast4
  ) {
    return { success: false, error: 'Incorrect name or phone number.' };
  }

  const session: AuthSession = { isLoggedIn: true, profile };
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

  if (SUPABASE_CONFIGURED) {
    ensureAnonymousSession().catch((e) => {
      console.log('Background session check on login failed:', e);
    });
  }

  return { success: true, profile };
};

// ── Get current session ───────────────────────────────────────────────────
export const getSession = async (): Promise<AuthSession> => {
  const saved = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!saved) return { isLoggedIn: false, profile: null };
  return JSON.parse(saved);
};

// ── Logout ────────────────────────────────────────────────────────────────
export const logoutFisher = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  if (SUPABASE_CONFIGURED && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
};

// ── Update profile ────────────────────────────────────────────────────────
export const updateFisherProfile = async (
  updates: Partial<Omit<FisherProfile, 'id' | 'owner_id' | 'auth_pending' | 'created_at'>>
): Promise<FisherProfile | null> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  if (!saved) return null;

  const profile: FisherProfile = { ...JSON.parse(saved), ...updates };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  const session = await getSession();
  if (session.isLoggedIn) {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...session, profile }));
  }

  // Sync profile update if online
  if (SUPABASE_CONFIGURED) {
    ensureAnonymousSession().catch(() => {});
  }

  return profile;
};

// ── Check if any account exists ───────────────────────────────────────────
export const hasExistingAccount = async (): Promise<boolean> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  return saved !== null;
};

// FisherMart — Auth Service
// Handles local authentication using AsyncStorage
// No backend required — works fully offline

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../database/db';

const AUTH_SESSION_KEY = '@fishermart_session';
const PROFILE_KEY = '@fishermart_profile';

export interface FisherProfile {
  id: string;
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

// ── Register a new fisher account ─────────────────────────────────────────
export const registerFisher = async (
  profile: Omit<FisherProfile, 'id' | 'created_at'>
): Promise<FisherProfile> => {
  const id = `fisher_${Date.now()}`;
  const now = new Date().toISOString();

  const newProfile: FisherProfile = {
    ...profile,
    id,
    created_at: now,
  };

  // Save profile to AsyncStorage
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));

  // Save session
  const session: AuthSession = { isLoggedIn: true, profile: newProfile };
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

  // Also persist name/phone to SQLite settings table for offline use
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

  return newProfile;
};

// ── Login (works offline if previously registered) ────────────────────────
export const loginFisher = async (
  name: string,
  phone: string
): Promise<{ success: boolean; profile?: FisherProfile; error?: string }> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  if (!saved) {
    return { success: false, error: 'No account found. Please register first.' };
  }

  const profile: FisherProfile = JSON.parse(saved);

  // Simple credential check — name + last 4 digits of phone
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
};

// ── Update profile ────────────────────────────────────────────────────────
export const updateFisherProfile = async (
  updates: Partial<Omit<FisherProfile, 'id' | 'created_at'>>
): Promise<FisherProfile | null> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  if (!saved) return null;

  const profile: FisherProfile = { ...JSON.parse(saved), ...updates };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  const session = await getSession();
  if (session.isLoggedIn) {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...session, profile }));
  }

  return profile;
};

// ── Check if any account exists ───────────────────────────────────────────
export const hasExistingAccount = async (): Promise<boolean> => {
  const saved = await AsyncStorage.getItem(PROFILE_KEY);
  return saved !== null;
};

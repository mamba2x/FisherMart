import { create } from 'zustand';
import {
  FisherProfile,
  AuthSession,
  getSession,
  loginFisher,
  registerFisher,
  logoutFisher,
  hasExistingAccount,
} from '../services/authService';

interface AuthState {
  isLoggedIn: boolean;
  profile: FisherProfile | null;
  loading: boolean;
  error: string | null;
  hasAccount: boolean;

  // Actions
  initAuth: () => Promise<void>;
  login: (name: string, phone: string) => Promise<boolean>;
  register: (data: Omit<FisherProfile, 'id' | 'owner_id' | 'auth_pending' | 'created_at'>) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  profile: null,
  loading: true,
  error: null,
  hasAccount: false,

  // Called on app start — restore session from AsyncStorage
  initAuth: async () => {
    set({ loading: true });
    try {
      const [session, accountExists] = await Promise.all([
        getSession(),
        hasExistingAccount(),
      ]);
      set({
        isLoggedIn: session.isLoggedIn,
        profile: session.profile,
        hasAccount: accountExists,
        loading: false,
      });
    } catch {
      set({ loading: false, isLoggedIn: false, profile: null });
    }
  },

  login: async (name, phone) => {
    set({ loading: true, error: null });
    const result = await loginFisher(name, phone);
    if (result.success && result.profile) {
      set({ isLoggedIn: true, profile: result.profile, loading: false });
      return true;
    } else {
      set({ error: result.error ?? 'Login failed', loading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const profile = await registerFisher(data);
      set({ isLoggedIn: true, profile, hasAccount: true, loading: false });
      return true;
    } catch (e: any) {
      set({ error: e.message ?? 'Registration failed', loading: false });
      return false;
    }
  },

  logout: async () => {
    await logoutFisher();
    set({ isLoggedIn: false, profile: null });
  },

  clearError: () => set({ error: null }),
}));

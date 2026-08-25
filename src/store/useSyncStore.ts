import { create } from 'zustand';
import { syncData, getPendingSyncCount, getLastSyncTime, getFailedSyncCount } from '../services/syncService';
import { ensureAnonymousSession } from '../services/authService';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: string | null;
  lastSyncResult: { pushed: number; pulled: number } | null;
  error: string | null;

  triggerSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  refreshFailedCount: () => Promise<void>;
  refreshLastSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  lastSyncTime: null,
  lastSyncResult: null,
  error: null,

  triggerSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, error: null });
    try {
      // Proactively ensure anonymous session and run migration first
      const uid = await ensureAnonymousSession();
      if (!uid) {
        throw new Error('Authentication is required to sync data');
      }

      const result = await syncData();
      if (result.success) {
        set({
          isSyncing: false,
          lastSyncResult: { pushed: result.pushed, pulled: result.pulled },
          lastSyncTime: new Date().toISOString(),
        });
      } else {
        set({ isSyncing: false, error: result.error ?? 'Sync failed' });
      }
    } catch (e: any) {
      set({ isSyncing: false, error: e.message });
    }
    await get().refreshPendingCount();
    await get().refreshFailedCount();
    await get().refreshLastSync();
  },

  refreshPendingCount: async () => {
    const count = await getPendingSyncCount();
    set({ pendingCount: count });
  },

  refreshFailedCount: async () => {
    const count = await getFailedSyncCount();
    set({ failedCount: count });
  },

  refreshLastSync: async () => {
    const time = await getLastSyncTime();
    set({ lastSyncTime: time });
  },
}));

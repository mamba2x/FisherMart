import { create } from 'zustand';
import { syncData, getPendingSyncCount, getLastSyncTime } from '../services/syncService';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastSyncResult: { pushed: number; pulled: number } | null;
  error: string | null;

  triggerSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  refreshLastSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastSyncResult: null,
  error: null,

  triggerSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, error: null });
    try {
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
    get().refreshPendingCount();
  },

  refreshPendingCount: async () => {
    const count = await getPendingSyncCount();
    set({ pendingCount: count });
  },

  refreshLastSync: async () => {
    const time = await getLastSyncTime();
    set({ lastSyncTime: time });
  },
}));

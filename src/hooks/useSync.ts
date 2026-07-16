// useSync — Auto-trigger sync when the network comes back online
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useSyncStore } from '../store/useSyncStore';

/**
 * This hook monitors network connectivity and automatically triggers
 * the sync engine whenever the device reconnects to the internet.
 *
 * Usage: call once at the top-level screen (e.g. DashboardScreen)
 */
export const useSync = () => {
  const { isConnected } = useNetworkStatus();
  const { triggerSync, refreshPendingCount } = useSyncStore();
  const prevConnected = useRef<boolean | null>(null);

  useEffect(() => {
    // Refresh pending count on mount
    refreshPendingCount();
  }, []);

  useEffect(() => {
    // Trigger sync when transitioning from offline → online
    if (prevConnected.current === false && isConnected === true) {
      triggerSync();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  return { isConnected };
};

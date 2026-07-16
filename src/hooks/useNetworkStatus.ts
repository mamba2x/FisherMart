import { useEffect, useRef, useState } from 'react';
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: 'unknown',
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setStatus({
        isConnected: state.isConnected ?? false,
        connectionType: state.type ?? 'unknown',
      });
    } catch {
      setStatus({ isConnected: false, connectionType: 'unknown' });
    }
  };

  useEffect(() => {
    checkNetwork();
    // Poll every 5 seconds (expo-network doesn't have event listeners)
    intervalRef.current = setInterval(checkNetwork, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
};

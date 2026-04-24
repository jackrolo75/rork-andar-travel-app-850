import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface NetworkStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: number;
  checkConnection: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      if (Platform.OS === 'web') {
        setIsConnected(navigator.onLine);
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          await fetch('https://clients3.google.com/generate_204', {
            method: 'HEAD',
            signal: controller.signal,
          });
          setIsConnected(true);
        } catch {
          setIsConnected(false);
        } finally {
          clearTimeout(timeoutId);
        }
      }
      setLastChecked(Date.now());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkConnection();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const interval = setInterval(() => {
      void checkConnection();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isConnected, isChecking, lastChecked, checkConnection };
}

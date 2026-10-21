import { useEffect, useState, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [lastOnlineAt, setLastOnlineAt] = useState<Date>(new Date());
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const checkServerHealth = useCallback(async () => {
    try {
      setIsReconnecting(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsOnline(true);
        setLastOnlineAt(new Date());
      } else {
        setIsOnline(false);
      }
    } catch {
      // Offline or server unreachable
      setIsOnline(false);
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      checkServerHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat every 45 seconds when online, or every 10 seconds when offline to auto-recover
    const intervalTime = isOnline ? 45000 : 10000;
    const interval = setInterval(() => {
      checkServerHealth();
    }, intervalTime);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, checkServerHealth]);

  return {
    isOnline,
    lastOnlineAt,
    isReconnecting,
    checkServerHealth,
  };
}

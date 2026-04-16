import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export function useHeartbeat() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const ping = () => {
      api.post('/online-status/heartbeat').catch(() => {
        // Silently fail if server is down or temporarily unreachable
      });
    };

    // Send immediate heartbeat
    ping();

    // Set interval for every 30 seconds (as per Database.sql system_settings)
    const intervalId = setInterval(ping, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
}

import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/feedback';

export function useSignalR() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { add: addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    connection.on('ChildStatusChanged', (data: { userId: number; isOnline: boolean; lastSeenAt: string }) => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.setQueryData(['child', data.userId], (old: any) => {
        if (!old) return old;
        return { ...old, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt };
      });
    });

    connection.on('ReceiveNotification', (n: any) => {
      if (n.notificationType !== 'tamper_alert') {
        toast.info(n.title, { description: n.message });
      }
      addNotification(n);
    });

    connection.on('ScreenshotReady', (data: {
      screenshotId: number;
      childId: number;
      domain: string;
      status?: string;
      imageUrl?: string;
      errorMessage?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['screenshots', data.childId, data.domain] });
      queryClient.invalidateQueries({ queryKey: ['screenshots', data.childId, data.domain, 'modal'] });

      if (data.status === 'tab_not_found') {
        toast.warning(`Con chÃƒâ€ Ã‚Â°a mÃƒÂ¡Ã‚Â»Ã…Â¸ website ${data.domain}`);
      } else if (data.status === 'failed') {
        toast.error(`ChÃƒÂ¡Ã‚Â»Ã‚Â¥p ÃƒÂ¡Ã‚ÂºÃ‚Â£nh ${data.domain} thÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â¡i`, {
          description: data.errorMessage || 'KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ chÃƒÂ¡Ã‚Â»Ã‚Â¥p ÃƒÂ¡Ã‚ÂºÃ‚Â£nh',
        });
      } else if (data.imageUrl || data.status === 'captured') {
        toast.success(`Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ chÃƒÂ¡Ã‚Â»Ã‚Â¥p ÃƒÂ¡Ã‚ÂºÃ‚Â£nh ${data.domain}`);
      }
    });


    connection.start().catch((err) => console.warn('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, accessToken, queryClient, addNotification]);
}

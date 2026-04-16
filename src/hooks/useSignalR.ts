import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSignalR() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { add: addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // Child status changed -> update lists
    connection.on('ChildStatusChanged', (data: { userId: number; isOnline: boolean; lastSeenAt: string }) => {
      // Invalidate children list or update specific cache
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.setQueryData(['child', data.userId], (old: any) => {
        if (!old) return old;
        return { ...old, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt };
      });
    });

    // New website usage alert or restriction triggered
    connection.on('ReceiveNotification', (n: any) => {
      toast.info(n.title, { description: n.message });
      addNotification(n);
    });

    connection.start().catch((err) => console.warn('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, accessToken, queryClient, addNotification]);
}

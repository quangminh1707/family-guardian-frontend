import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/feedback';

export function useExtensionMonitor() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { add: addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const { user } = useAuthStore.getState();

    // Chỉ chạy cho Guardian
    if (!user || user.role !== 'Guardian') return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    connection
      .start()
      .then(() => {
        connection.invoke('JoinGuardianGroup', user.id.toString());
        console.log('[SignalR] ExtensionMonitor connected, joined guardian group');
      })
      .catch((err) => console.warn('[SignalR] ExtensionMonitor connection error:', err));

    // ─── Nhận sự kiện extension của con tắt ───────────────────
    connection.on('ExtensionOffline', (data: {
      childId: number;
      childName: string;
      detectedAt: string;
      notificationId: number;
    }) => {
      console.warn(`[ExtensionMonitor] ${data.childName} turned off extension`);

      // Hiện toast cảnh báo
      toast.warning(`⚠️ ${data.childName} vừa tắt extension bộ lọc!`, {
        duration: 10_000,
        action: {
          label: 'Xem chi tiết',
          onClick: () => window.location.href = `/children/${data.childId}`
        }
      });

      // Thêm vào notification store (bell icon)
      addNotification({
        id: data.notificationId ?? Date.now(),
        title: '⚠️ Extension bị tắt',
        message: `${data.childName} vừa tắt extension bộ lọc web`,
        type: 'warning',
        isRead: false,
        createdAt: data.detectedAt,
        childId: data.childId,
        guardianId: useAuthStore.getState().user?.id ?? 0,
      });

      // ✅ Refresh trang thông báo + danh sách con
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['child', data.childId] });
    });

    // ─── Lắng nghe cảnh báo thời gian ──────────────────────────────
    connection.on('TimeWarning', (data: {
      childId: number;
      childName: string;
      domain: string;
      message: string;
      remainingSeconds: number;
      notificationId: number;
    }) => {
      toast.warning(`⏰ ${data.childName}: ${data.message}`, {
        duration: 10_000,
        action: {
          label: 'Xem chi tiết',
          onClick: () => window.location.href = `/children/${data.childId}`
        }
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // ─── Lắng nghe yêu cầu truy cập từ con ─────────────────────
    connection.on('AccessRequest', (data: {
      childName: string;
      childAvatarUrl?: string;
      domain: string;
      message: string;
    }) => {
      toast.warning(`🔔 ${data.childName} muốn truy cập ${data.domain}`, {
        duration: 10_000,
        action: {
          label: 'Xem yêu cầu',
          onClick: () => window.location.href = '/notifications'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, accessToken, queryClient, addNotification]);
}

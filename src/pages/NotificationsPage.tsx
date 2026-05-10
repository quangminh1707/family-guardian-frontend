import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { accessRequestsApi } from '../api/accessRequests.api';
import { useNotificationStore } from '../store/notificationStore';
import { AlertTriangle, Info, Clock, Trash2, Inbox, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatRelativeTime } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/feedback';
import { AccessRequestCard } from '../components/ui';
import { useAuthStore } from '../store/authStore';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setNotifications, markAsRead: markInStore } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications'>('requests');
  const [requestFilter, setRequestFilter] = useState<'pending' | 'handled' | 'all'>('pending');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['access-requests', requestFilter],
    queryFn: () => accessRequestsApi.getRequests(requestFilter).then((res) => res.data),
    refetchInterval: 30_000,
    enabled: user?.role === 'Guardian',
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', notifFilter],
    queryFn: () => notificationsApi.getNotifications(notifFilter).then((res) => {
      setNotifications(res.data);
      return res.data;
    }),
    refetchInterval: 30_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onMutate: (id) => markInStore(id),
    onSuccess: () => {
      toast.success('Đã đánh dấu đã đọc');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Có lỗi xảy ra');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('Đã đọc tất cả thông báo');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Có lỗi xảy ra');
    },
  });

  const pendingCount = requests?.length ?? 0;
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const hasUnread = unreadCount > 0;
  const showRequests = activeTab === 'requests';

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-violet-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-violet-500';
    }
  };

  const renderRequestFilters = () => (
    <div className="mb-4 flex gap-2">
      {(['pending', 'handled', 'all'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setRequestFilter(f)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            requestFilter === f
              ? 'border-brand-DEFAULT bg-brand-DEFAULT/10 text-brand-DEFAULT'
              : 'border-border-base bg-bg-subtle text-tx-secondary hover:border-brand-DEFAULT/50'
          }`}
        >
          {f === 'pending' ? 'Chờ duyệt' : f === 'handled' ? 'Đã xử lý' : 'Tất cả'}
        </button>
      ))}
    </div>
  );

  const renderNotificationFilters = () => (
    <div className="mb-4 flex gap-2">
      {(['all', 'unread', 'read'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setNotifFilter(f)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            notifFilter === f
              ? 'border-brand-DEFAULT bg-brand-DEFAULT/10 text-brand-DEFAULT'
              : 'border-border-base bg-bg-subtle text-tx-secondary hover:border-brand-DEFAULT/50'
          }`}
        >
          {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tight text-tx-primary">Thông báo</h2>
          <p className="font-medium text-tx-secondary">Theo dõi yêu cầu và thông báo từ hệ thống.</p>
        </div>

        {activeTab === 'notifications' && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={!hasUnread || markAllAsReadMutation.isPending}
            className="h-12 rounded-2xl border-border-base text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
          >
            <CheckCircle2 className="h-5 w-8" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-border-base bg-bg-subtle p-1">
        <button
          onClick={() => setActiveTab('requests')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'requests' ? 'bg-brand-DEFAULT text-white shadow-sm' : 'text-tx-secondary hover:text-tx-primary'
          }`}
        >
          Yêu cầu
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'notifications' ? 'bg-brand-DEFAULT text-white shadow-sm' : 'text-tx-secondary hover:text-tx-primary'
          }`}
        >
          Thông báo
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {showRequests ? renderRequestFilters() : renderNotificationFilters()}

      {showRequests ? (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {requests.map((req) => (
                <AccessRequestCard key={req.id} request={req} />
              ))}
            </div>
          ) : (
            <div className="rounded-[3rem] border border-dashed border-border-subtle bg-bg-surface p-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-bg-subtle">
                <Inbox className="h-10 w-10 text-tx-muted" />
              </div>
              <h3 className="text-xl font-bold text-tx-primary">Không có yêu cầu</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-tx-secondary">
                Chưa có yêu cầu nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notificationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'group relative rounded-[2rem] border border-border-base border-l-4 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-xl',
                    getBorderColor(n.type),
                    !n.isRead ? 'border-brand/20 bg-brand-subtle/30' : 'bg-bg-surface/60'
                  )}
                >
                  <div className="flex gap-6">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner',
                        n.type === 'warning' ? 'bg-error-bg' : n.type === 'info' ? 'bg-bg-subtle' : 'bg-brand-subtle'
                      )}
                    >
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className={cn('text-lg font-bold tracking-tight', n.isRead ? 'text-tx-secondary' : 'text-tx-primary')}>
                          {n.title}
                        </h3>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-tx-muted">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className={cn('text-sm leading-relaxed', n.isRead ? 'text-tx-muted' : 'text-gray-500')}>
                        {n.message}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        {!n.isRead && (
                          <Button
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(n.id)}
                            className="h-8 rounded-xl bg-violet-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-violet-700"
                          >
                            Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-xl p-0 text-tx-muted hover:bg-error-bg hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {!n.isRead && <div className="absolute right-8 top-6 h-2 w-2 animate-pulse rounded-full bg-violet-600" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[3rem] border border-dashed border-border-subtle bg-bg-surface p-24 text-center">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-bg-subtle shadow-inner">
                <Inbox className="h-10 w-10 text-tx-muted" />
              </div>
              <h3 className="text-xl font-bold text-tx-primary">Hộp thư trống</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-tx-secondary">
                Bạn không có thông báo nào vào lúc này. Mọi thứ đều đang diễn ra ổn.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

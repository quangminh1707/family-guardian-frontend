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
import { AccessRequestCard, FilterDropdown } from '../components/ui';
import { useAuthStore } from '../store/authStore';

const NOTIF_PAGE_SIZE = 5;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setNotifications, markAsRead: markInStore } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications'>('requests');
  const [requestFilter, setRequestFilter] = useState<'pending' | 'handled' | 'all'>('pending');
  const [reasonFilter, setReasonFilter] = useState<
    'all' | 'internet_paused' | 'time_limit_exceeded' | 'not_in_whitelist'
  >('all');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notifShowAll, setNotifShowAll] = useState(false);

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['access-requests', requestFilter],
    queryFn: () => accessRequestsApi.getRequests(requestFilter).then((res) => res.data),
    refetchInterval: 30_000,
    enabled: user?.role === 'Guardian',
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', notifFilter],
    queryFn: () =>
      notificationsApi.getNotifications(notifFilter).then((res) => {
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

  const pendingRequestsCount = requests?.length ?? 0;
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const hasUnread = unreadCount > 0;
  const filteredRequests = (requests ?? []).filter((req) =>
    reasonFilter === 'all' ? true : req.reason === reasonFilter
  );
  const filteredNotifications = notifications ?? [];
  const visibleNotifications = notifShowAll
    ? filteredNotifications
    : filteredNotifications.slice(0, NOTIF_PAGE_SIZE);
  const hasMoreNotifications = filteredNotifications.length > NOTIF_PAGE_SIZE;
  const showRequests = activeTab === 'requests';

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-brand" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-brand';
    }
  };

  const handleRequestFilterChange = (f: typeof requestFilter) => {
    setRequestFilter(f);
    setReasonFilter('all');
  };

  const handleNotifFilterChange = (f: typeof notifFilter) => {
    setNotifFilter(f);
    setNotifShowAll(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-tx-primary">Thông Báo</h1>
        <p className="mt-1 text-sm text-tx-secondary">Theo dõi yêu cầu và thông báo từ hệ thống.</p>
      </div>

      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="relative flex rounded-2xl border border-border-base bg-bg-subtle p-1">
          <div
            className="absolute bottom-1 top-1 rounded-2xl border border-border-base/80 bg-bg-surface shadow-sm transition-all duration-200 ease-out"
            style={{
              width: 'calc(50% - 4px)',
              left: activeTab === 'requests' ? '4px' : 'calc(50%)',
            }}
          />

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`relative z-10 flex min-w-[120px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'requests' ? 'text-tx-primary' : 'text-tx-secondary hover:text-tx-primary'
            }`}
          >
            Yêu cầu
            <span
              className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold transition-colors ${
                activeTab === 'requests' ? 'bg-amber-500 text-white' : 'bg-bg-muted text-tx-secondary'
              }`}
            >
              {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`relative z-10 flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'notifications' ? 'text-tx-primary' : 'text-tx-secondary hover:text-tx-primary'
            }`}
          >
            Thông báo
            <span
              className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold transition-colors ${
                activeTab === 'notifications' ? 'bg-red-500 text-white' : 'bg-bg-muted text-tx-secondary'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </button>
        </div>

        {activeTab === 'notifications' && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={!hasUnread || markAllAsReadMutation.isPending}
            className="h-11 rounded-xl border-border-base text-xs font-medium text-tx-secondary transition-all hover:text-tx-primary"
          >
            <CheckCircle2 className="h-5 w-7" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="mt-4">
        <div key={activeTab} className="animate-in fade-in duration-150">
          {showRequests ? (
            <>
              <div className="mb-5 flex items-center gap-2">
                <FilterDropdown
                  label="Trạng thái"
                  options={[
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'handled', label: 'Đã xử lý' },
                    { value: 'all', label: 'Tất cả' },
                  ]}
                  value={requestFilter}
                  onChange={handleRequestFilterChange}
                />

                <FilterDropdown
                  label="Loại yêu cầu"
                  options={[
                    { value: 'all', label: 'Tất cả loại' },
                    { value: 'internet_paused', label: 'Tạm dừng Internet', icon: '⏸' },
                    { value: 'time_limit_exceeded', label: 'Hết giờ sử dụng', icon: '⏱' },
                    { value: 'not_in_whitelist', label: 'Web mới', icon: '🌐' },
                  ]}
                  value={reasonFilter}
                  onChange={(v) => setReasonFilter(v)}
                />

                {(requestFilter !== 'pending' || reasonFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestFilter('pending');
                      setReasonFilter('all');
                    }}
                    className="ml-auto flex items-center gap-1 text-[11px] text-tx-secondary transition-colors hover:text-red-400"
                  >
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {requestsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />
                    ))}
                  </div>
                ) : filteredRequests.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredRequests.map((req) => (
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
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-2">
                <FilterDropdown
                  label="Trạng thái đọc"
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'unread', label: 'Chưa đọc' },
                    { value: 'read', label: 'Đã đọc' },
                  ]}
                  value={notifFilter}
                  onChange={handleNotifFilterChange}
                />
              </div>

              <div className="space-y-4">
                {notificationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {visibleNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'group relative rounded-[2rem] border border-border-base border-l-4 bg-bg-surface p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-xl',
                          getBorderColor(n.type),
                          !n.isRead ? 'border-brand/20 bg-brand-subtle/30' : 'bg-bg-surface/60'
                        )}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                          <div
                            className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner',
                              n.type === 'warning' ? 'bg-error-bg' : n.type === 'info' ? 'bg-bg-subtle' : 'bg-brand-subtle'
                            )}
                          >
                            {getIcon(n.type)}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="mb-1 flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-2">
                                <h3 className={cn('text-lg font-bold tracking-tight', n.isRead ? 'text-tx-secondary' : 'text-tx-primary')}>
                                  {n.title}
                                </h3>
                                {n.notificationType === 'tamper_alert' && (
                                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-error/30 bg-error/15 px-2 py-0.5 text-[11px] font-semibold text-error">
                                    ⚠ Cảnh báo bảo mật
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-tx-muted">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>

                            <p className={cn('text-sm leading-relaxed', n.isRead ? 'text-tx-muted' : 'text-tx-secondary')}>
                              {n.message}
                            </p>

                            <div className="mt-4 flex items-center gap-3">
                              {!n.isRead && (
                                <Button
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(n.id)}
                                  className="h-8 rounded-xl bg-brand px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-brand-hover"
                                >
                                  Đánh dấu đã đọc
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-xl p-0 text-tx-muted hover:bg-error-bg hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!n.isRead && <div className="absolute right-8 top-6 h-2 w-2 animate-pulse rounded-full bg-brand" />}
                        </div>
                      </div>
                    ))}

                    {hasMoreNotifications && (
                      <button
                        type="button"
                        onClick={() => setNotifShowAll((prev) => !prev)}
                        className="mt-3 w-full rounded-xl border border-border-base bg-bg-subtle py-2.5 text-sm font-medium text-tx-secondary transition-colors hover:bg-bg-surface hover:text-tx-primary"
                      >
                        {notifShowAll
                          ? '↑ Thu gọn'
                          : `↓ Xem thêm ${filteredNotifications.length - NOTIF_PAGE_SIZE} thông báo`}
                      </button>
                    )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

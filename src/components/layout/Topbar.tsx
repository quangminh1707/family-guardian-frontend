import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle2,
  Inbox,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useNotificationStore } from '../../store/notificationStore';
import { notificationsApi } from '../../api/notifications.api';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { Notification } from '../../types/notification.types';
import { ConfirmModal, toast } from '../feedback';
import { ThemeToggle } from '../theme';

const MAX_VISIBLE = 3;

function NotificationIcon({ type }: { type: string }) {
  if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (type === 'info') return <Info className="w-4 h-4 text-blue-500" />;
  return <Bell className="w-4 h-4 text-violet-500" />;
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { setNotifications, markAsRead: markInStore } = useNotificationStore();
  const [expanded, setExpanded] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationsApi.getNotifications().then((res) => {
        setNotifications(res.data);
        return res.data;
      }),
    staleTime: 30_000,
  });

  const markMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onMutate: (id) => markInStore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Không thể cập nhật thông báo'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Không thể cập nhật thông báo'),
  });

  const unread = notifications.filter((n: Notification) => !n.isRead);
  const visible = expanded ? notifications : notifications.slice(0, MAX_VISIBLE);
  const hasMore = notifications.length > MAX_VISIBLE;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-bg-elevated rounded-2xl shadow-2xl border border-border-base z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-base bg-bg-elevated sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-600" />
          <span className="font-bold text-tx-primary text-sm">Thông báo</span>
          {unread.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unread.length}
            </span>
          )}
        </div>

        <Link
          to="/notifications"
          onClick={onClose}
          className="text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1 bg-violet-50 px-2 py-1.5 rounded-lg"
        >
          Trang thông báo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Quick Actions (Read All) */}
      {unread.length > 0 && (
        <div className="px-5 py-2 bg-bg-subtle/50 flex justify-end border-b border-border-base">
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-[10px] font-bold text-gray-400 hover:text-violet-600 transition-colors flex items-center gap-1 disabled:opacity-50 uppercase tracking-wider"
          >
            <CheckCircle2 className="w-3 h-3" />
            Đánh dấu đọc tất cả
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-border-subtle">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            <span className="text-xs">Đang tải...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-gray-400">
            <Inbox className="w-10 h-10 text-gray-200" />
            <span className="text-xs font-medium">Không có thông báo</span>
          </div>
        ) : (
          visible.map((n: Notification) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.isRead) markMutation.mutate(n.id);
              }}
              className={cn(
                'w-full text-left px-5 py-4 transition-colors hover:bg-bg-subtle flex gap-3 items-start group',
                !n.isRead && 'bg-brand-subtle/20'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
                n.type === 'warning' ? 'bg-red-50 text-red-500' : n.type === 'info' ? 'bg-blue-50 text-blue-500' : 'bg-violet-50 text-violet-500'
              )}>
                <NotificationIcon type={n.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-bold leading-snug truncate', n.isRead ? 'text-tx-secondary' : 'text-tx-primary')}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
                <p className="text-[13px] text-tx-secondary line-clamp-2 mt-1 leading-relaxed font-medium">{n.message}</p>
                <p className="text-[10px] text-tx-muted mt-2 font-bold uppercase tracking-wider">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer (Expand / Collapse) */}
      {hasMore && (
        <div className="border-t border-border-base bg-bg-subtle/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-3 text-xs font-bold text-brand hover:bg-brand-subtle transition-colors flex items-center justify-center gap-1.5"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Rút gọn danh sách</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Xem thêm ({notifications.length - MAX_VISIBLE} thông báo)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [bellOpen, setBellOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!bellOpen) return;
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  return (
    <header className="h-16 border-b border-border-base bg-bg-surface px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tx-muted group-focus-within:text-brand transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full bg-bg-subtle border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-sm text-tx-primary placeholder:text-tx-muted focus:ring-2 focus:ring-brand/20 focus:bg-bg-surface transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* Bell → dropdown thông báo */}
        <div className="relative" ref={bellRef}>
          <Button
            variant="ghost"
            size="icon"
            id="bell-btn"
            className="relative text-tx-secondary hover:text-brand hover:bg-brand-subtle rounded-xl transition-colors"
            onClick={() => setBellOpen((prev) => !prev)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-bg-surface animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {bellOpen && (
            <NotificationDropdown onClose={() => setBellOpen(false)} />
          )}
        </div>

        <div className="w-[1px] h-6 bg-border-base" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 pl-2 pr-3 py-1 hover:bg-brand-subtle rounded-xl transition-colors h-auto"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-tx-primary leading-none">{user?.fullName}</span>
                <span className="text-[10px] font-semibold text-brand mt-1 uppercase tracking-wide">Guardian</span>
              </div>
              <ChevronDown className="h-4 w-4 text-tx-secondary" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-xl border border-border-base bg-bg-elevated">
            {/* Email header */}
            <div className="px-3 py-2.5">
              <p className="text-xs font-bold text-tx-primary truncate">{user?.fullName}</p>
              <p className="text-[11px] text-tx-secondary truncate mt-0.5">{user?.email}</p>
            </div>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 font-semibold text-tx-primary hover:text-brand hover:bg-brand-subtle focus:bg-brand-subtle focus:text-brand transition-colors">
              <User className="w-4 h-4" />
              Thông tin cá nhân
            </DropdownMenuItem>

            <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 font-semibold text-tx-primary hover:text-brand hover:bg-brand-subtle focus:bg-brand-subtle focus:text-brand transition-colors">
              <Settings className="w-4 h-4" />
              Cài đặt
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem 
              className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 font-bold text-red-500 hover:text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 transition-colors"
              onSelect={(event) => {
                event.preventDefault();
                setShowLogoutConfirm(true);
              }}
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}

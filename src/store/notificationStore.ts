import { create } from 'zustand';
import type { Notification } from '../types/notification.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  add: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: number) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (ns) =>
    set({
      notifications: ns,
      unreadCount: ns.filter((n) => !n.isRead).length,
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));

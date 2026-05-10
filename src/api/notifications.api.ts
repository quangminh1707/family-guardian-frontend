import api from './axios';
import type { Notification } from '../types/notification.types';

export const notificationsApi = {
  getNotifications: (filter: 'all' | 'unread' | 'read' = 'all') => 
    api.get<Notification[]>(`/notifications?filter=${filter}`),

  getUnread: () =>
    api.get<Notification[]>('/notifications/unread'),
  
  markAsRead: (id: number) => 
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
  
  sendNotification: (childId: number, data: { title: string; message: string; type: string }) => 
    api.post(`/notifications/to-child/${childId}`, data),
};

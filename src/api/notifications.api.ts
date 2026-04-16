import api from './axios';
import type { Notification } from '../types/notification.types';

export const notificationsApi = {
  getNotifications: () => 
    api.get<Notification[]>('/notifications'),
  
  markAsRead: (id: number) => 
    api.post(`/notifications/${id}/read`),
  
  sendNotification: (childId: number, data: { title: string; message: string; type: string }) => 
    api.post(`/notifications/send-to-child/${childId}`, data),
};

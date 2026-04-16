export type NotificationType = 'reminder' | 'warning' | 'info';

export interface Notification {
  id: number;
  guardianId: number;
  childId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}


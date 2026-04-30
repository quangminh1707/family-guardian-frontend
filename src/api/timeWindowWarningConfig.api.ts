import api from './axios';

export interface TimeWindowWarningConfig {
  id: number;
  allowedWebsiteId: number;
  domain?: string;
  warnMinutesBefore1: number;
  message1: string;
  warnMinutesBefore2?: number | null;
  message2?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface UpsertTimeWindowWarningConfigPayload {
  allowedWebsiteId: number;
  warnMinutesBefore1: number;
  message1: string;
  warnMinutesBefore2?: number | null;
  message2?: string | null;
}

export const timeWindowWarningConfigApi = {
  getByWebsite: (allowedWebsiteId: number) =>
    api.get<TimeWindowWarningConfig>(`/timewindow-warning-configs`, { params: { allowedWebsiteId } }),

  getByChild: (childId: number) =>
    api.get<TimeWindowWarningConfig[]>(`/timewindow-warning-configs/by-child/${childId}`),

  upsert: (payload: UpsertTimeWindowWarningConfigPayload) =>
    api.post(`/timewindow-warning-configs`, payload),

  delete: (id: number) =>
    api.delete(`/timewindow-warning-configs/${id}`),
};

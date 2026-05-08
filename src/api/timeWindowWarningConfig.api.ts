import api from './axios';

export interface TimeWindowWarningConfig {
  id: number;
  allowedWebsiteId: number;
  domain?: string;
  warnMode?: 'minutes_before' | 'at_time';
  warnMinutesBefore1: number | null;
  message1: string | null;
  warnMinutesBefore2?: number | null;
  message2?: string | null;
  warnAtTime1?: string | null;
  warnAtTime2?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface UpsertTimeWindowWarningConfigRequest {
  allowedWebsiteId: number;
  warnMode?: 'minutes_before' | 'at_time';
  warnMinutesBefore1?: number | null;
  message1?: string | null;
  warnMinutesBefore2?: number | null;
  message2?: string | null;
  warnAtTime1?: string | null;
  warnAtTimeMessage1?: string | null;
  warnAtTime2?: string | null;
  warnAtTimeMessage2?: string | null;
  isActive?: boolean;
}

export type UpsertTimeWindowWarningConfigPayload = UpsertTimeWindowWarningConfigRequest;

export const timeWindowWarningConfigApi = {
  getByWebsite: (allowedWebsiteId: number) =>
    api.get<TimeWindowWarningConfig>(`/timewindow-warning-configs`, { params: { allowedWebsiteId } }),

  getByChild: (childId: number) =>
    api.get<TimeWindowWarningConfig[]>(`/timewindow-warning-configs/by-child/${childId}`),

  upsert: (payload: UpsertTimeWindowWarningConfigRequest) =>
    api.post(`/timewindow-warning-configs`, payload),

  delete: (id: number) =>
    api.delete(`/timewindow-warning-configs/${id}`),
};

import api from './axios';
import type { LogsResponse, UsageHistory, SessionsResponse, UsageSummary } from '../types/log.types';

export const logsApi = {
  getAccessLogs: (childId: number, params: { fromDate: string; toDate: string; page: number; pageSize: number }) => 
    api.get<LogsResponse>(`/access-logs/${childId}`, { params }),
  
  getUsageHistory: (childId: number, params: { fromDate: string; toDate: string }) => 
    api.get<UsageHistory[]>(`/access-logs/${childId}/usage-history`, { params }),

  getSessions: (childId: number, params?: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<SessionsResponse>(`/children/${childId}/logs/sessions`, { params }),

  getSummary: (childId: number, days: number = 7) =>
    api.get<UsageSummary>(`/children/${childId}/logs/summary`, { params: { days } }),
};

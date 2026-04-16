import api from './axios';
import type { LogsResponse, UsageHistory } from '../types/log.types';

export const logsApi = {
  getAccessLogs: (childId: number, params: { fromDate: string; toDate: string; page: number; pageSize: number }) => 
    api.get<LogsResponse>(`/access-logs/${childId}`, { params }),
  
  getUsageHistory: (childId: number, params: { fromDate: string; toDate: string }) => 
    api.get<UsageHistory[]>(`/access-logs/${childId}/usage-history`, { params }),
};

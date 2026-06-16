import api from './axios';

export interface DailyUsage {
  date: string;
  totalSeconds: number;
}

export interface DomainUsage {
  domain: string;
  totalSeconds: number;
}

export const analyticsApi = {
  getWeeklyUsage: (childId: number) =>
    api.get<DailyUsage[]>(`/analytics/weekly?childId=${childId}`).then((r) => r.data),

  getTopDomains: (childId: number) =>
    api.get<DomainUsage[]>(`/analytics/top-domains?childId=${childId}`).then((r) => r.data),
};

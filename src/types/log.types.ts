export type AccessResult = 'allowed' | 'blocked';

export interface AccessLog {
  id: number;
  domain: string;
  fullUrl?: string;
  accessResult: AccessResult;
  durationSeconds: number;
  sessionStart: string;
  sessionEnd?: string;
  displayName?: string;
  faviconUrl?: string;
}

export interface UsageHistory {
  usageDate: string;
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  totalSeconds: number;
  requestCount: number;
  timeLimitMinutes?: number;
  limitExceeded: boolean;
}

export interface LogsResponse {
  items: AccessLog[];
  total: number;
}

export interface WebSession {
  id: number;
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  isActive: boolean;
}

export interface SessionsResponse {
  items: WebSession[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DomainSummary {
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  timeLimitMinutes?: number;
  totalSeconds: number;
  totalRequests: number;
}

export interface DaySummary {
  date: string;
  totalSeconds: number;
}

export interface UsageSummary {
  byDomain: DomainSummary[];
  byDay: DaySummary[];
  days: number;
}


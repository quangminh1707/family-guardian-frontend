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


export interface AllowedWebsite {
  id: number;
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  isActive: boolean;
  timeLimitMinutes?: number;
  allowedStartTime?: string;  // "07:00"
  allowedEndTime?: string;    // "21:00"
  isVerified: boolean;
  isSafe?: boolean;
  httpStatusCode?: number;
  lastCheckedAt?: string;
  todaySeconds: number;
  todayRequests: number;
  limitExceeded: boolean;
}

export interface AddWebsiteRequest {
  domain: string;
  timeLimitMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
}

export interface UpdateWebsiteRequest {
  timeLimitMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
}

export interface WebsiteCheckResult {
  domain: string;
  isReachable: boolean;
  httpStatusCode?: number;
  responseTimeMs?: number;
  isSafe: boolean;
  threatType?: string;
  faviconUrl?: string;
  checkedAt: string;
}

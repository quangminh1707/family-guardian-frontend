import api from './axios';

export interface AccessRequestDto {
  id: number;
  childId: number;
  childName: string;
  childAvatarUrl?: string;
  domain: string;
  fullUrl?: string;
  reason: string;
  requestedDurationMinutes?: number | null;
  requestedStartTime?: string | null;
  requestedEndTime?: string | null;
  status: string;
  requestedAt: string;
  tempExpiresAt?: string | null;
  websiteRestrictionType?: 'minutes' | 'time_window' | null;
  websiteTimeLimitMinutes?: number | null;
  websiteAllowedStartTime?: string | null;
  websiteAllowedEndTime?: string | null;
}

export interface RespondAccessRequestDto {
  action: 'approve_temp' | 'approve_permanent' | 'reject' | 'extend_time' | 'approve_internet' | 'extend_window';
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  newEndTime?: string;
  newStartTime?: string;
}

export const accessRequestsApi = {
  getPending: () =>
    api.get<AccessRequestDto[]>('/access-requests'),

  getRequests: (status: 'pending' | 'handled' | 'all' = 'pending') =>
    api.get<AccessRequestDto[]>(`/access-requests?status=${status}`),

  respond: (id: number, dto: RespondAccessRequestDto) =>
    api.patch(`/access-requests/${id}/respond`, dto),
};

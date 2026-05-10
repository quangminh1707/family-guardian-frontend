import api from './axios';

export interface AccessRequestDto {
  id: number;
  childId: number;
  childName: string;
  childAvatarUrl?: string;
  domain: string;
  fullUrl?: string;
  status: string;
  requestedAt: string;
  tempExpiresAt?: string;
}

export interface RespondAccessRequestDto {
  action: 'approve_temp' | 'approve_permanent' | 'reject';
  durationMinutes?: number;
}

export const accessRequestsApi = {
  getPending: () =>
    api.get<AccessRequestDto[]>('/access-requests'),

  respond: (id: number, dto: RespondAccessRequestDto) =>
    api.patch(`/access-requests/${id}/respond`, dto),
};

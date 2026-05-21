import api from './axios';
import type { ChildUser } from '../types/user.types';
import type { UpdateWebsiteRequest } from '../types/website.types';

export interface ScreenshotDto {
  id: number;
  domain: string;
  status: 'pending' | 'captured' | 'failed' | 'tab_not_found';
  imageUrl: string | null;
  capturedAt: string;
  errorMessage: string | null;
}

export const childrenApi = {
  getMyChildren: () =>
    api.get<ChildUser[]>('/children'),

  getChildDetail: (childId: number) =>
    api.get<ChildUser>(`/children/${childId}`),

  unlinkChild: (childId: number) =>
    api.delete(`/children/${childId}`),

  updateWebsite: (childId: number, websiteId: number, data: UpdateWebsiteRequest) =>
    api.put(`/children/${childId}/websites/${websiteId}`, data),

  pauseInternet: (childId: number) =>
    api.patch<{ internetPaused: boolean; message: string }>(`/children/${childId}/pause-internet`),

  requestScreenshot: (childId: number, domain: string) =>
    api.post<{ screenshotId: number; message: string }>(`/children/${childId}/request-screenshot?domain=${encodeURIComponent(domain)}`),

  getScreenshots: (childId: number, domain: string, limit = 10) =>
    api.get<ScreenshotDto[]>(`/children/${childId}/screenshots?domain=${encodeURIComponent(domain)}&limit=${limit}`),
};

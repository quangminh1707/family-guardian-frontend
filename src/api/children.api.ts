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

export const requestScreenshot = async (childId: number, domain: string) => {
  const res = await api.post<{ screenshotId: number; message: string }>(
    `/children/${childId}/request-screenshot?domain=${encodeURIComponent(domain)}`,
  );
  return res.data;
};

export const getScreenshots = async (childId: number, domain: string, limit = 10) => {
  const res = await api.get<ScreenshotDto[]>(
    `/children/${childId}/screenshots?domain=${encodeURIComponent(domain)}&limit=${limit}`,
  );
  return res.data;
};

export interface ScheduledScreenshotDto {
  id: number;
  domain: string;
  scheduledAt: string;
  status: string;
  screenshotId: number | null;
}

export const deleteScreenshot = async (childId: number, screenshotId: number) => {
  await api.delete(`/children/${childId}/screenshots/${screenshotId}`);
};

export const scheduleScreenshot = async (
  childId: number,
  domain: string,
  scheduledAt: string,
) => {
  const res = await api.post<{ scheduleId: number; message: string }>(
    `/children/${childId}/schedule-screenshot`,
    { domain, scheduledAt },
  );
  return res.data;
};

export const getScheduledScreenshots = async (childId: number, domain: string) => {
  const res = await api.get<ScheduledScreenshotDto[]>(
    `/children/${childId}/scheduled-screenshots`,
    { params: { domain } },
  );
  return res.data;
};

export const cancelScheduledScreenshot = async (childId: number, scheduleId: number) => {
  await api.delete(`/children/${childId}/scheduled-screenshots/${scheduleId}`);
};

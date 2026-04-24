import axios from './axios';

export interface WarningConfig {
  id: number;
  allowedWebsiteId: number;
  domain?: string;
  threshold1Percent: number;
  threshold1Message: string;
  threshold2Percent?: number | null;
  threshold2Message?: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertWarningConfigPayload {
  allowedWebsiteIds: number[];
  threshold1Percent: number;
  threshold1Message: string;
  threshold2Percent?: number | null;
  threshold2Message?: string | null;
}

export const warningConfigApi = {
  getByWebsite: (allowedWebsiteId: number) =>
    axios.get<WarningConfig>(`/warning-configs`, { params: { allowedWebsiteId } }),

  getByChild: (childId: number) =>
    axios.get<WarningConfig[]>(`/warning-configs/by-child/${childId}`),

  upsert: (payload: UpsertWarningConfigPayload) =>
    axios.post(`/warning-configs`, payload),

  delete: (id: number) =>
    axios.delete(`/warning-configs/${id}`),
};

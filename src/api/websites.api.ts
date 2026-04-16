import api from './axios';
import type { AllowedWebsite, AddWebsiteRequest, UpdateWebsiteRequest } from '../types/website.types';

export const websitesApi = {
  getWebsites: (childId: number) => 
    api.get<AllowedWebsite[]>(`/children/${childId}/websites`),
  
  addWebsite: (childId: number, data: AddWebsiteRequest) => 
    api.post<AllowedWebsite>(`/children/${childId}/websites`, data),
  
  updateWebsite: (childId: number, websiteId: number, data: UpdateWebsiteRequest) => 
    api.put(`/children/${childId}/websites/${websiteId}`, data),
  
  deleteWebsite: (childId: number, websiteId: number) => 
    api.delete(`/children/${childId}/websites/${websiteId}`),
  
  toggleWebsite: (childId: number, websiteId: number) => 
    api.patch<{ isActive: boolean }>(`/children/${childId}/websites/${websiteId}/toggle`),
  
  recheckWebsite: (childId: number, websiteId: number) => 
    api.post(`/children/${childId}/websites/${websiteId}/recheck`),
};

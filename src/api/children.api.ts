import api from './axios';
import type { ChildUser } from '../types/user.types';
import type { UpdateWebsiteRequest } from '../types/website.types';

export const childrenApi = {
  getMyChildren: () => 
    api.get<ChildUser[]>('/children'),
  
  getChildDetail: (childId: number) => 
    api.get<ChildUser>(`/children/${childId}`),
  
  unlinkChild: (childId: number) => 
    api.delete(`/children/${childId}`),

  updateWebsite: (childId: number, websiteId: number, data: UpdateWebsiteRequest) =>
    api.put(`/children/${childId}/websites/${websiteId}`, data),
};

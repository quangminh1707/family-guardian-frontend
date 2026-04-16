import api from './axios';
import type { ChildUser } from '../types/user.types';

export const childrenApi = {
  getMyChildren: () => 
    api.get<ChildUser[]>('/children'),
  
  getChildDetail: (childId: number) => 
    api.get<ChildUser>(`/children/${childId}`),
  
  unlinkChild: (childId: number) => 
    api.delete(`/children/${childId}`),
  
  // IP Mappings (for proxy identification)
  getIpMappings: (childId: number) => 
    api.get(`/children/${childId}/ip-mappings`),
  
  addIpMapping: (childId: number, data: { ipAddress: string; deviceName?: string }) => 
    api.post(`/children/${childId}/ip-mappings`, data),
  
  removeIpMapping: (childId: number, mappingId: number) => 
    api.delete(`/children/${childId}/ip-mappings/${mappingId}`),
};

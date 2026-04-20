import api from './axios';
import type { ChildUser } from '../types/user.types';

export const childrenApi = {
  getMyChildren: () => 
    api.get<ChildUser[]>('/children'),
  
  getChildDetail: (childId: number) => 
    api.get<ChildUser>(`/children/${childId}`),
  
  unlinkChild: (childId: number) => 
    api.delete(`/children/${childId}`),
};

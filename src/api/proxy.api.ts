import { api } from './axios';

export interface ProxyIpMapping {
  id: number;
  childId: number;
  ipAddress: string;
  deviceName?: string;
  googleId?: string;
  googleEmail?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AddIpMappingRequest {
  ipAddress: string;
  deviceName?: string;
}

export const proxyApi = {
  // Lấy danh sách IP mapping
  getIpMappings: async (childId: number) => {
    return api.get<ProxyIpMapping[]>(`/children/${childId}/ip-mappings`);
  },

  // Thêm IP mapping mới
  addIpMapping: async (childId: number, data: AddIpMappingRequest) => {
    return api.post<{ message: string }>(`/children/${childId}/ip-mappings`, data);
  },

  // Xóa IP mapping
  removeIpMapping: async (childId: number, mappingId: number) => {
    return api.delete<{ message: string }>(`/children/${childId}/ip-mappings/${mappingId}`);
  },

  // Download root certificate
  downloadRootCert: async () => {
    return api.get(`/admin/proxy-root-cert`, {
      responseType: 'blob',
    });
  },
};

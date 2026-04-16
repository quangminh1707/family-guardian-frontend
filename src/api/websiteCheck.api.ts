import api from './axios';
import type { WebsiteCheckResult } from '../types/website.types';

export const websiteCheckApi = {
  checkWebsite: (domain: string) => 
    api.get<WebsiteCheckResult>('/website-check', { params: { domain } }),
};

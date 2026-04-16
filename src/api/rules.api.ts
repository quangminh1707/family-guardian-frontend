// rules.api.ts
import api from './axios'
import type { CreateRuleRequest } from '../types/rule.types'

export const rulesApi = {
  getRules: (childId: number) => api.get(`/children/${childId}/rules`),
  createRule: (childId: number, data: CreateRuleRequest) => api.post(`/children/${childId}/rules`, data),
  updateRule: (childId: number, ruleId: number, data: CreateRuleRequest) => api.put(`/children/${childId}/rules/${ruleId}`, data),
  toggleRule: (childId: number, ruleId: number) => api.patch(`/children/${childId}/rules/${ruleId}/toggle`),
  deleteRule: (childId: number, ruleId: number) => api.delete(`/children/${childId}/rules/${ruleId}`),
}


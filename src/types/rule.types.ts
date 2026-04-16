export type RuleType = 'allow' | 'block';

export interface WebRule {
  id: number;
  domain: string;
  ruleType: RuleType;
  timeLimitMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
  isActive: boolean;
  createdByName: string;
  createdAt: string;
  todayUsageSeconds: number;
}

export interface CreateRuleRequest {
  domain: string;
  ruleType: RuleType;
  timeLimitMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
}


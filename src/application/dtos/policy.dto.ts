import { PolicyViolationType, PolicySeverity, CategoryType } from '../../domain/enums';

export interface CreatePolicyRuleDto {
  code: string;
  name: string;
  description?: string;
  violationType: PolicyViolationType;
  severity: PolicySeverity;
  categoryType?: CategoryType;
  categoryId?: string;
  maxAmount?: number;
  maxDailyAmount?: number;
  maxAgeInDays?: number;
  requiresReceipt?: boolean;
  requiresJustification?: boolean;
  allowWeekend?: boolean;
  allowAlcohol?: boolean;
}

export interface UpdatePolicyRuleDto extends Partial<CreatePolicyRuleDto> {
  isActive?: boolean;
}

export interface PolicyRuleResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  violationType: PolicyViolationType;
  severity: PolicySeverity;
  categoryType?: CategoryType;
  categoryId?: string;
  maxAmount?: { amount: number; cents: number; currency: string; formatted: string } | null;
  maxDailyAmount?: { amount: number; cents: number; currency: string; formatted: string } | null;
  maxAgeInDays?: number;
  requiresReceipt?: boolean;
  requiresJustification?: boolean;
  allowWeekend?: boolean;
  allowAlcohol?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

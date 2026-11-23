import { Currency } from '../../domain/enums';

export interface CreateBudgetDto {
  costCenterId: string;
  year: number;
  month?: number;
  allocatedAmount: number;
  currency?: Currency;
  alertThresholdPercentage?: number;
}

export interface UpdateBudgetDto {
  allocatedAmount?: number;
  alertThresholdPercentage?: number;
  isActive?: boolean;
}

export interface BudgetResponseDto {
  id: string;
  costCenterId: string;
  year: number;
  month?: number;
  allocatedAmount: { amount: number; cents: number; currency: string; formatted: string };
  consumedAmount: { amount: number; cents: number; currency: string; formatted: string };
  reservedAmount: { amount: number; cents: number; currency: string; formatted: string };
  availableAmount: { amount: number; cents: number; currency: string; formatted: string };
  consumptionPercentage: number;
  isThresholdExceeded: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

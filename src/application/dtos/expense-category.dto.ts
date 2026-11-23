import { CategoryType } from '../../domain/enums';

export interface CreateExpenseCategoryDto {
  code: string;
  name: string;
  type: CategoryType;
  description?: string;
  maxLimitPerExpense?: number;
  maxDailyLimit?: number;
  requiresReceipt?: boolean;
  requiresItemization?: boolean;
  requiresJustification?: boolean;
  mileageRatePerKm?: number;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  type?: CategoryType;
  description?: string;
  maxLimitPerExpense?: number;
  maxDailyLimit?: number;
  requiresReceipt?: boolean;
  requiresItemization?: boolean;
  requiresJustification?: boolean;
  mileageRatePerKm?: number;
  isActive?: boolean;
}

export interface ExpenseCategoryResponseDto {
  id: string;
  code: string;
  name: string;
  type: CategoryType;
  description?: string;
  maxLimitPerExpense?: { amount: number; cents: number; currency: string; formatted: string } | null;
  maxDailyLimit?: { amount: number; cents: number; currency: string; formatted: string } | null;
  requiresReceipt: boolean;
  requiresItemization: boolean;
  requiresJustification: boolean;
  mileageRatePerKm?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

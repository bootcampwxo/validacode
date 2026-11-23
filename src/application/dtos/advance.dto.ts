import { AdvanceStatus, Currency } from '../../domain/enums';

export interface CreateAdvancePaymentDto {
  departmentId?: string;
  costCenterId?: string;
  purpose: string;
  requestedAmount: number;
  currency?: Currency;
  expectedReconciliationDate: string;
}

export interface ApproveAdvanceDto {
  approvedAmount?: number;
}

export interface RejectAdvanceDto {
  reason: string;
}

export interface ReconcileAdvanceDto {
  expenseId: string;
}

export interface AdvancePaymentResponseDto {
  id: string;
  code: string;
  userId: string;
  departmentId: string;
  costCenterId: string;
  purpose: string;
  requestedAmount: { amount: number; cents: number; currency: string; formatted: string };
  approvedAmount?: { amount: number; cents: number; currency: string; formatted: string } | null;
  currency: Currency;
  status: AdvanceStatus;
  requestDate: Date;
  expectedReconciliationDate: Date;
  actualReconciliationDate?: Date;
  approvedById?: string;
  approvedAt?: Date;
  disbursedAt?: Date;
  rejectionReason?: string;
  reconciledExpenseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

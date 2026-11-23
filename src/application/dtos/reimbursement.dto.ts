import { PaymentStatus, PaymentMethod, Currency } from '../../domain/enums';
import { BankDetailsDto } from './user.dto';

export interface CreateReimbursementBatchDto {
  description?: string;
  expenseIds: string[];
  scheduledDate?: string;
}

export interface ProcessBatchPaymentDto {
  transactionReferencePrefix?: string;
}

export interface ReimbursementPaymentResponseDto {
  id: string;
  batchId?: string;
  expenseId: string;
  recipientId: string;
  amount: { amount: number; cents: number; currency: string; formatted: string };
  paymentMethod: PaymentMethod;
  bankDetailsSnapshot?: BankDetailsDto | null;
  status: PaymentStatus;
  transactionReference?: string;
  receiptNumber?: string;
  failureReason?: string;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReimbursementBatchResponseDto {
  id: string;
  batchCode: string;
  description?: string;
  status: PaymentStatus;
  totalAmount: { amount: number; cents: number; currency: string; formatted: string };
  totalExpensesCount: number;
  scheduledDate?: Date;
  processedAt?: Date;
  processedById?: string;
  payments: ReimbursementPaymentResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

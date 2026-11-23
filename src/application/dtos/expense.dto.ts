import { ExpenseStatus, Currency } from '../../domain/enums';
import { PolicyViolation } from '../../domain/policies/IPolicyChecker';

export interface CreateExpenseItemDto {
  categoryId: string;
  description: string;
  amount: number;
  currency?: Currency;
  expenseDate: string;
  merchantName?: string;
  merchantTaxId?: string;
  invoiceNumber?: string;
  kilometers?: number;
  participantsCount?: number;
  participantsNames?: string[];
  justification?: string;
}

export interface UpdateExpenseItemDto extends Partial<CreateExpenseItemDto> {}

export interface CreateExpenseDto {
  title: string;
  description?: string;
  departmentId?: string;
  costCenterId?: string;
  currency?: Currency;
  advancePaymentId?: string;
  items?: CreateExpenseItemDto[];
  metadata?: Record<string, unknown>;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  departmentId?: string;
  costCenterId?: string;
  advancePaymentId?: string;
  metadata?: Record<string, unknown>;
}

export interface ExpenseItemResponseDto {
  id: string;
  expenseId: string;
  categoryId: string;
  description: string;
  amount: { amount: number; cents: number; currency: string; formatted: string };
  expenseDate: string;
  merchantName?: string;
  merchantTaxId?: string;
  invoiceNumber?: string;
  kilometers?: number;
  participantsCount?: number;
  participantsNames?: string[];
  justification?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseReceiptResponseDto {
  id: string;
  expenseId: string;
  expenseItemId?: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  ocrExtractedText?: string;
  ocrExtractedAmount?: number;
  ocrExtractedDate?: Date;
  ocrExtractedCnpj?: string;
  isVerified: boolean;
  uploadedById: string;
  createdAt: Date;
}

export interface ExpenseResponseDto {
  id: string;
  code: string;
  title: string;
  description?: string;
  userId: string;
  departmentId: string;
  costCenterId: string;
  status: ExpenseStatus;
  currency: Currency;
  totalAmount: { amount: number; cents: number; currency: string; formatted: string };
  reimbursableAmount: { amount: number; cents: number; currency: string; formatted: string };
  advancePaymentId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  revisionNotes?: string;
  items: ExpenseItemResponseDto[];
  receipts: ExpenseReceiptResponseDto[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitExpenseResponseDto {
  expense: ExpenseResponseDto;
  policyValidation: {
    isValid: boolean;
    hasBlockingViolations: boolean;
    hasWarnings: boolean;
    violations: PolicyViolation[];
  };
}

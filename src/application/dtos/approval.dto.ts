import { ApprovalLevel, ApprovalStatus } from '../../domain/enums';

export interface ApproveExpenseDto {
  comments?: string;
}

export interface RejectExpenseDto {
  reason: string;
}

export interface RequestRevisionDto {
  instructions: string;
}

export interface ApprovalStepResponseDto {
  id: string;
  workflowId: string;
  stepOrder: number;
  level: ApprovalLevel;
  approverId?: string;
  approverRoleId?: string;
  status: ApprovalStatus;
  thresholdAmount?: { amount: number; cents: number; currency: string; formatted: string } | null;
  assignedAt?: Date;
  decidedAt?: Date;
  comments?: string;
  isAutoApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalWorkflowResponseDto {
  id: string;
  expenseId: string;
  status: ApprovalStatus;
  currentStepOrder: number;
  totalSteps: number;
  steps: ApprovalStepResponseDto[];
  startedAt: Date;
  completedAt?: Date;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

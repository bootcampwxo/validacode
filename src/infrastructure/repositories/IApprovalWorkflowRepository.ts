import { ApprovalWorkflow } from '../../domain/entities/ApprovalWorkflow';
import { ApprovalStep } from '../../domain/entities/ApprovalStep';
import { ApprovalAction } from '../../domain/entities/ApprovalAction';
import { IBaseRepository } from './IBaseRepository';
import { ApprovalStatus } from '../../domain/enums';

export interface IApprovalWorkflowRepository extends IBaseRepository<ApprovalWorkflow> {
  findByExpenseId(expenseId: string): Promise<ApprovalWorkflow | null>;
  findPendingStepsByApprover(approverId: string): Promise<ApprovalStep[]>;
  saveStep(step: ApprovalStep): Promise<ApprovalStep>;
  updateStep(step: ApprovalStep): Promise<ApprovalStep>;
  recordAction(action: ApprovalAction): Promise<ApprovalAction>;
  getActionsByExpenseId(expenseId: string): Promise<ApprovalAction[]>;
}

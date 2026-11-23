import { Expense } from '../../domain/entities/Expense';
import { IBaseRepository } from './IBaseRepository';
import { ExpenseStatus } from '../../domain/enums';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface ExpenseFilterParams extends PaginationParams {
  userId?: string;
  departmentId?: string;
  costCenterId?: string;
  status?: ExpenseStatus | ExpenseStatus[];
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
}

export interface IExpenseRepository extends IBaseRepository<Expense> {
  findByCode(code: string): Promise<Expense | null>;
  findWithDetails(id: string): Promise<Expense | null>;
  searchExpenses(filters: ExpenseFilterParams): Promise<PaginatedResult<Expense>>;
  findPendingApprovalByApprover(approverId: string): Promise<Expense[]>;
  findUserDailyExpenses(userId: string, date: Date | string): Promise<Expense[]>;
  generateNextCode(): Promise<string>;
}

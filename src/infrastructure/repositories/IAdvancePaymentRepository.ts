import { AdvancePayment } from '../../domain/entities/AdvancePayment';
import { IBaseRepository } from './IBaseRepository';
import { AdvanceStatus } from '../../domain/enums';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface AdvanceFilterParams extends PaginationParams {
  userId?: string;
  departmentId?: string;
  costCenterId?: string;
  status?: AdvanceStatus;
}

export interface IAdvancePaymentRepository extends IBaseRepository<AdvancePayment> {
  findByCode(code: string): Promise<AdvancePayment | null>;
  findByUserId(userId: string): Promise<AdvancePayment[]>;
  findPendingAdvances(): Promise<AdvancePayment[]>;
  searchAdvances(filters: AdvanceFilterParams): Promise<PaginatedResult<AdvancePayment>>;
  generateNextCode(): Promise<string>;
}

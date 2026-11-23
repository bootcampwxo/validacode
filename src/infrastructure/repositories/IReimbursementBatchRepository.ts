import { ReimbursementBatch } from '../../domain/entities/ReimbursementBatch';
import { IBaseRepository } from './IBaseRepository';
import { PaymentStatus } from '../../domain/enums';

export interface IReimbursementBatchRepository extends IBaseRepository<ReimbursementBatch> {
  findByBatchCode(code: string): Promise<ReimbursementBatch | null>;
  findPendingBatches(): Promise<ReimbursementBatch[]>;
  findByStatus(status: PaymentStatus): Promise<ReimbursementBatch[]>;
  findWithPayments(id: string): Promise<ReimbursementBatch | null>;
  generateNextBatchCode(): Promise<string>;
}

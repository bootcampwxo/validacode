import { ReimbursementPayment } from '../../domain/entities/ReimbursementPayment';
import { IBaseRepository } from './IBaseRepository';
import { PaymentStatus } from '../../domain/enums';

export interface IReimbursementPaymentRepository extends IBaseRepository<ReimbursementPayment> {
  findByExpenseId(expenseId: string): Promise<ReimbursementPayment | null>;
  findByRecipientId(recipientId: string): Promise<ReimbursementPayment[]>;
  findByBatchId(batchId: string): Promise<ReimbursementPayment[]>;
  findByStatus(status: PaymentStatus): Promise<ReimbursementPayment[]>;
}

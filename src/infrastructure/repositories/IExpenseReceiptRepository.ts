import { ExpenseReceipt } from '../../domain/entities/ExpenseReceipt';
import { IBaseRepository } from './IBaseRepository';

export interface IExpenseReceiptRepository extends IBaseRepository<ExpenseReceipt> {
  findByExpenseId(expenseId: string): Promise<ExpenseReceipt[]>;
  findByItemId(itemId: string): Promise<ExpenseReceipt[]>;
  findByFileHash(fileHash: string): Promise<ExpenseReceipt | null>;
}

import { ExpenseItem } from '../../domain/entities/ExpenseItem';
import { IBaseRepository } from './IBaseRepository';

export interface IExpenseItemRepository extends IBaseRepository<ExpenseItem> {
  findByExpenseId(expenseId: string): Promise<ExpenseItem[]>;
  findByCategoryId(categoryId: string): Promise<ExpenseItem[]>;
  deleteByExpenseId(expenseId: string): Promise<number>;
}

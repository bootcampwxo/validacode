import { ExpenseCategory } from '../../domain/entities/ExpenseCategory';
import { IBaseRepository } from './IBaseRepository';
import { CategoryType } from '../../domain/enums';

export interface IExpenseCategoryRepository extends IBaseRepository<ExpenseCategory> {
  findByCode(code: string): Promise<ExpenseCategory | null>;
  findByType(type: CategoryType): Promise<ExpenseCategory[]>;
  findActiveCategories(): Promise<ExpenseCategory[]>;
}

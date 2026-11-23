import { Budget } from '../../domain/entities/Budget';
import { IBaseRepository } from './IBaseRepository';

export interface IBudgetRepository extends IBaseRepository<Budget> {
  findByCostCenterAndPeriod(costCenterId: string, year: number, month?: number): Promise<Budget | null>;
  findBudgetsByYear(year: number): Promise<Budget[]>;
}

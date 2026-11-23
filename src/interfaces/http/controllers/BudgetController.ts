import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../../../application/services/BudgetService';

export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budget = await this.budgetService.createBudget(req.body);
      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budget = await this.budgetService.getBudgetById(req.params.id);
      res.status(200).json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  };

  public getByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = parseInt(req.params.year || `${new Date().getFullYear()}`, 10);
      const budgets = await this.budgetService.getBudgetsByYear(year);
      res.status(200).json({ success: true, data: budgets });
    } catch (error) {
      next(error);
    }
  };
}

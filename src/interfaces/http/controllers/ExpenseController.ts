import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../../../application/services/ExpenseService';

export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const expense = await this.expenseService.createExpense(userId, req.body, meta);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.expenseService.getExpenseById(
        req.params.id,
        req.user?.userId,
        req.user?.role
      );
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = { ...req.query } as any;
      // Se for colaborador simples, restringe para ver apenas as suas despesas
      if (req.user?.role === 'EMPLOYEE') {
        filters.userId = req.user.userId;
      }
      const result = await this.expenseService.searchExpenses(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const expense = await this.expenseService.addItemToExpense(req.params.id, req.body, userId);
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  public removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const expense = await this.expenseService.removeItemFromExpense(
        req.params.id,
        req.params.itemId,
        userId
      );
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  public submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const result = await this.expenseService.submitExpense(req.params.id, userId, meta);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const expense = await this.expenseService.cancelExpense(req.params.id, userId);
      res.status(200).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };
}

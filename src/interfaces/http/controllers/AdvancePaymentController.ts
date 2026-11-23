import { Request, Response, NextFunction } from 'express';
import { AdvancePaymentService } from '../../../application/services/AdvancePaymentService';

export class AdvancePaymentController {
  constructor(private readonly advanceService: AdvancePaymentService) {}

  public request = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const advance = await this.advanceService.requestAdvance(userId, req.body);
      res.status(201).json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverId = req.user!.userId;
      const advance = await this.advanceService.approveAdvance(req.params.id, approverId, req.body);
      res.status(200).json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverId = req.user!.userId;
      const advance = await this.advanceService.rejectAdvance(req.params.id, approverId, req.body);
      res.status(200).json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  };

  public disburse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const advance = await this.advanceService.markDisbursed(req.params.id);
      res.status(200).json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = { ...req.query } as any;
      if (req.user?.role === 'EMPLOYEE') {
        filters.userId = req.user.userId;
      }
      const result = await this.advanceService.searchAdvances(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { ReimbursementBatchService } from '../../../application/services/ReimbursementBatchService';

export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementBatchService) {}

  public createBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user!.userId;
      const batch = await this.reimbursementService.createBatch(req.body, authorId);
      res.status(201).json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  };

  public getBatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batch = await this.reimbursementService.getBatchById(req.params.id);
      res.status(200).json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  };

  public processBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const processedById = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const batch = await this.reimbursementService.processBatch(
        req.params.id,
        req.body,
        processedById,
        meta
      );
      res.status(200).json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  };

  public listPending = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await this.reimbursementService.listPendingBatches();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };
}

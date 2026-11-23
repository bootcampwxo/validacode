import { Request, Response, NextFunction } from 'express';
import { ApprovalWorkflowService } from '../../../application/services/ApprovalWorkflowService';

export class ApprovalController {
  constructor(private readonly workflowService: ApprovalWorkflowService) {}

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverId = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const result = await this.workflowService.approve(req.params.id, approverId, req.body, meta);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverId = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const result = await this.workflowService.reject(req.params.id, approverId, req.body, meta);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public requestRevision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverId = req.user!.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const result = await this.workflowService.requestRevision(
        req.params.id,
        approverId,
        req.body,
        meta
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public getWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workflowService.getWorkflowByExpenseId(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}

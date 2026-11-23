import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../../application/services/AuditService';

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.auditService.searchLogs(req.query as any);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entityName, entityId } = req.params;
      const history = await this.auditService.getEntityHistory(entityName, entityId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}

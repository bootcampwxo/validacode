import { Request, Response, NextFunction } from 'express';
import { CostCenterService } from '../../../application/services/CostCenterService';

export class CostCenterController {
  constructor(private readonly costCenterService: CostCenterService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cc = await this.costCenterService.createCostCenter(req.body);
      res.status(201).json({ success: true, data: cc });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cc = await this.costCenterService.getCostCenterById(req.params.id);
      res.status(200).json({ success: true, data: cc });
    } catch (error) {
      next(error);
    }
  };

  public listActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await this.costCenterService.listActiveCostCenters();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cc = await this.costCenterService.updateCostCenter(req.params.id, req.body);
      res.status(200).json({ success: true, data: cc });
    } catch (error) {
      next(error);
    }
  };
}

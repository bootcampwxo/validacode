import { Request, Response, NextFunction } from 'express';
import { PolicyService } from '../../../application/services/PolicyService';

export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.policyService.createPolicyRule(req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  };

  public listActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await this.policyService.listActiveRules();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.policyService.getRuleById(req.params.id);
      res.status(200).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.policyService.updatePolicyRule(req.params.id, req.body);
      res.status(200).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  };
}

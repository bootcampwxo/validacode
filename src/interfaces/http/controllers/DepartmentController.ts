import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../../../application/services/DepartmentService';

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.departmentService.createDepartment(req.body);
      res.status(201).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.departmentService.getDepartmentById(req.params.id);
      res.status(200).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  public listActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await this.departmentService.listActiveDepartments();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.departmentService.updateDepartment(req.params.id, req.body);
      res.status(200).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { ExpenseCategoryService } from '../../../application/services/ExpenseCategoryService';

export class ExpenseCategoryController {
  constructor(private readonly categoryService: ExpenseCategoryService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cat = await this.categoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: cat });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cat = await this.categoryService.getCategoryById(req.params.id);
      res.status(200).json({ success: true, data: cat });
    } catch (error) {
      next(error);
    }
  };

  public listActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await this.categoryService.listActiveCategories();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cat = await this.categoryService.updateCategory(req.params.id, req.body);
      res.status(200).json({ success: true, data: cat });
    } catch (error) {
      next(error);
    }
  };
}

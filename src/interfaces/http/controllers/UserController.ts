import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../../application/services/UserService';

export class UserController {
  constructor(private readonly userService: UserService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user?.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const user = await this.userService.createUser(req.body, authorId, meta);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.user!.userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.searchUsers(req.query as any);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user?.userId;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await this.userService.updateUser(req.params.id, req.body, authorId, meta);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user?.userId;
      await this.userService.deactivateUser(req.params.id, authorId);
      res.status(200).json({ success: true, message: 'Usuário desativado com sucesso' });
    } catch (error) {
      next(error);
    }
  };
}

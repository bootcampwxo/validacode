import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../../application/services/AuthService';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const result = await this.authService.login(req.body, meta);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.refreshToken(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      if (req.token && req.user) {
        await this.authService.logout(req.token, req.user.userId, meta);
      }
      res.status(200).json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await this.authService.changePassword(userId, req.body);
      res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
      next(error);
    }
  };
}

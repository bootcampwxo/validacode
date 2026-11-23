import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../../application/services/NotificationService';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await this.notificationService.getUserNotifications(userId, req.query as any);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const count = await this.notificationService.getUnreadCount(userId);
      res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markAsRead(req.params.id);
      res.status(200).json({ success: true, message: 'Notificação marcada como lida' });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updatedCount = await this.notificationService.markAllAsRead(userId);
      res.status(200).json({ success: true, message: `${updatedCount} notificações marcadas como lidas` });
    } catch (error) {
      next(error);
    }
  };
}

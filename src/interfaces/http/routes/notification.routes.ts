import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/auth.middleware';

export function createNotificationRoutes(notificationController: NotificationController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/my', notificationController.getMyNotifications);
  router.get('/unread-count', notificationController.getUnreadCount);
  router.put('/:id/read', notificationController.markAsRead);
  router.put('/mark-all-read', notificationController.markAllAsRead);

  return router;
}

import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';

export function createAnalyticsRoutes(analyticsController: AnalyticsController): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(
    roleMiddleware(
      UserRole.ADMIN,
      UserRole.DIRECTOR,
      UserRole.VP,
      UserRole.FINANCIAL_MANAGER,
      UserRole.AUDITOR
    )
  );

  router.get('/dashboard', analyticsController.getDashboard);
  router.get('/top-spenders', analyticsController.getTopSpenders);
  router.get('/export/top-spenders', analyticsController.exportTopSpendersCsv);

  return router;
}

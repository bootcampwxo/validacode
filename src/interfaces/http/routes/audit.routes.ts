import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';

export function createAuditRoutes(auditController: AuditController): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(roleMiddleware(UserRole.AUDITOR, UserRole.ADMIN, UserRole.FINANCIAL_MANAGER));

  router.get('/logs', auditController.search);
  router.get('/history/:entityName/:entityId', auditController.getHistory);

  return router;
}

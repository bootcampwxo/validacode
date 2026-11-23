import { Router } from 'express';
import { AdvancePaymentController } from '../controllers/AdvancePaymentController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createAdvancePaymentSchema } from '../validations';

export function createAdvanceRoutes(advanceController: AdvancePaymentController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', advanceController.search);
  router.post('/', validateBody(createAdvancePaymentSchema), advanceController.request);
  router.post('/:id/approve', roleMiddleware(UserRole.DIRECTOR, UserRole.FINANCIAL_MANAGER, UserRole.ADMIN), advanceController.approve);
  router.post('/:id/reject', roleMiddleware(UserRole.DIRECTOR, UserRole.FINANCIAL_MANAGER, UserRole.ADMIN), advanceController.reject);
  router.post('/:id/disburse', roleMiddleware(UserRole.FINANCIAL_MANAGER, UserRole.ADMIN), advanceController.disburse);

  return router;
}

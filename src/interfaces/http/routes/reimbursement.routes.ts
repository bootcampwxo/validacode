import { Router } from 'express';
import { ReimbursementController } from '../controllers/ReimbursementController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createReimbursementBatchSchema, processBatchPaymentSchema } from '../validations';

export function createReimbursementRoutes(reimbursementController: ReimbursementController): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(roleMiddleware(UserRole.FINANCIAL_MANAGER, UserRole.FINANCIAL_ANALYST, UserRole.ADMIN));

  router.get('/batches/pending', reimbursementController.listPending);
  router.get('/batches/:id', reimbursementController.getBatchById);
  router.post('/batches', validateBody(createReimbursementBatchSchema), reimbursementController.createBatch);
  router.post('/batches/:id/process', validateBody(processBatchPaymentSchema), reimbursementController.processBatch);

  return router;
}

import { Router } from 'express';
import { ApprovalController } from '../controllers/ApprovalController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, approveExpenseSchema, rejectExpenseSchema, requestRevisionSchema } from '../validations';

export function createApprovalRoutes(approvalController: ApprovalController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/expenses/:id/workflow', approvalController.getWorkflow);

  router.post(
    '/expenses/:id/approve',
    roleMiddleware(
      UserRole.MANAGER,
      UserRole.DIRECTOR,
      UserRole.VP,
      UserRole.FINANCIAL_MANAGER,
      UserRole.FINANCIAL_ANALYST,
      UserRole.ADMIN
    ),
    validateBody(approveExpenseSchema),
    approvalController.approve
  );

  router.post(
    '/expenses/:id/reject',
    roleMiddleware(
      UserRole.MANAGER,
      UserRole.DIRECTOR,
      UserRole.VP,
      UserRole.FINANCIAL_MANAGER,
      UserRole.ADMIN
    ),
    validateBody(rejectExpenseSchema),
    approvalController.reject
  );

  router.post(
    '/expenses/:id/request-revision',
    roleMiddleware(
      UserRole.MANAGER,
      UserRole.DIRECTOR,
      UserRole.VP,
      UserRole.FINANCIAL_MANAGER,
      UserRole.ADMIN
    ),
    validateBody(requestRevisionSchema),
    approvalController.requestRevision
  );

  return router;
}

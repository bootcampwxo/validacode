import { Router } from 'express';
import { BudgetController } from '../controllers/BudgetController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createBudgetSchema } from '../validations';

export function createBudgetRoutes(budgetController: BudgetController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/year/:year', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER, UserRole.DIRECTOR, UserRole.AUDITOR), budgetController.getByYear);
  router.get('/:id', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER, UserRole.DIRECTOR), budgetController.getById);
  router.post('/', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER), validateBody(createBudgetSchema), budgetController.create);

  return router;
}

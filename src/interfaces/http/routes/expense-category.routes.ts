import { Router } from 'express';
import { ExpenseCategoryController } from '../controllers/ExpenseCategoryController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';

export function createExpenseCategoryRoutes(categoryController: ExpenseCategoryController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', categoryController.listActive);
  router.get('/:id', categoryController.getById);
  router.post('/', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER), categoryController.create);
  router.put('/:id', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER), categoryController.update);

  return router;
}

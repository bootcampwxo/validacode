import { Router } from 'express';
import { CostCenterController } from '../controllers/CostCenterController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createCostCenterSchema } from '../validations';

export function createCostCenterRoutes(costCenterController: CostCenterController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', costCenterController.listActive);
  router.get('/:id', costCenterController.getById);
  router.post('/', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER), validateBody(createCostCenterSchema), costCenterController.create);
  router.put('/:id', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER), costCenterController.update);

  return router;
}

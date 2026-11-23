import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createDepartmentSchema } from '../validations';

export function createDepartmentRoutes(departmentController: DepartmentController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', departmentController.listActive);
  router.get('/:id', departmentController.getById);
  router.post('/', roleMiddleware(UserRole.ADMIN), validateBody(createDepartmentSchema), departmentController.create);
  router.put('/:id', roleMiddleware(UserRole.ADMIN), departmentController.update);

  return router;
}

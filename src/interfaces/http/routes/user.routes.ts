import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createUserSchema, updateUserSchema } from '../validations';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/me', userController.getMe);
  router.get('/', roleMiddleware(UserRole.ADMIN, UserRole.FINANCIAL_MANAGER, UserRole.AUDITOR), userController.search);
  router.post('/', roleMiddleware(UserRole.ADMIN), validateBody(createUserSchema), userController.create);
  router.get('/:id', userController.getById);
  router.put('/:id', validateBody(updateUserSchema), userController.update);
  router.delete('/:id', roleMiddleware(UserRole.ADMIN), userController.deactivate);

  return router;
}

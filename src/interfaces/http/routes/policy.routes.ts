import { Router } from 'express';
import { PolicyController } from '../controllers/PolicyController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '../../../domain/enums';
import { validateBody, createPolicyRuleSchema } from '../validations';

export function createPolicyRoutes(policyController: PolicyController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', policyController.listActive);
  router.get('/:id', policyController.getById);
  router.post('/', roleMiddleware(UserRole.ADMIN, UserRole.AUDITOR), validateBody(createPolicyRuleSchema), policyController.create);
  router.put('/:id', roleMiddleware(UserRole.ADMIN, UserRole.AUDITOR), policyController.update);

  return router;
}

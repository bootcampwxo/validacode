import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBody, loginSchema, refreshTokenSchema, changePasswordSchema } from '../validations';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/login', validateBody(loginSchema), authController.login);
  router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);
  router.post('/logout', authMiddleware, authController.logout);
  router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);

  return router;
}

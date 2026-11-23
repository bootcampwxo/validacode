import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../domain/enums';
import { ForbiddenError, UnauthorizedError } from '../../../domain/exceptions';

export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (req.user.role === UserRole.ADMIN) {
      return next(); // Admin tem acesso completo
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Acesso negado. Ação restrita aos perfis: [${allowedRoles.join(', ')}]. Seu perfil atual é '${req.user.role}'`
        )
      );
    }

    next();
  };
}

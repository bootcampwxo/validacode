import { Request, Response, NextFunction } from 'express';
import { JwtService, TokenPayload } from '../../../infrastructure/security/JwtService';
import { TokenBlacklist } from '../../../infrastructure/security/TokenBlacklist';
import { UnauthorizedError } from '../../../domain/exceptions';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

export class AuthMiddleware {
  private readonly jwtService: JwtService;
  private readonly blacklist: TokenBlacklist;

  constructor(jwtService?: JwtService, blacklist?: TokenBlacklist) {
    this.jwtService = jwtService || new JwtService();
    this.blacklist = blacklist || TokenBlacklist.getInstance();
  }

  public handle = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('Cabeçalho de autorização (Bearer token) ausente');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Formato de token inválido. Esperado: Bearer <token>');
      }

      const token = parts[1];
      if (this.blacklist.isRevoked(token)) {
        throw new UnauthorizedError('Token revogado. Por favor, autentique-se novamente');
      }

      const payload = this.jwtService.verifyAccessToken(token);
      req.user = payload;
      req.token = token;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authMiddleware = new AuthMiddleware().handle;

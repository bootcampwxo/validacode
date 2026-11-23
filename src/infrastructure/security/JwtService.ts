import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UserRole } from '../../domain/enums';
import { UnauthorizedError } from '../../domain/exceptions';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
    this.refreshSecret = config.jwt.refreshSecret;
    this.refreshExpiresIn = config.jwt.refreshExpiresIn;
  }

  public generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
    });

    const refreshToken = jwt.sign({ userId: payload.userId }, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as any,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.expiresIn,
    };
  }

  public verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Token de acesso inválido ou expirado');
    }
  }

  public verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.refreshSecret) as { userId: string };
    } catch (error) {
      throw new UnauthorizedError('Refresh token inválido ou expirado');
    }
  }
}

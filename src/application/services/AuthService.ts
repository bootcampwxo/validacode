import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/IAuditLogRepository';
import { BcryptHasher } from '../../infrastructure/security/BcryptHasher';
import { JwtService } from '../../infrastructure/security/JwtService';
import { TokenBlacklist } from '../../infrastructure/security/TokenBlacklist';
import { LoginDto, LoginResponseDto, RefreshTokenDto, ChangePasswordDto } from '../dtos/auth.dto';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../domain/exceptions';
import { AuditAction } from '../../domain/enums';
import { AuditLog } from '../../domain/entities/AuditLog';

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditRepository: IAuditLogRepository,
    private readonly hasher: BcryptHasher = new BcryptHasher(),
    private readonly jwtService: JwtService = new JwtService(),
    private readonly tokenBlacklist: TokenBlacklist = TokenBlacklist.getInstance()
  ) {}

  public async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas (email ou senha incorretos)');
    }

    if (!user.isActive()) {
      throw new UnauthorizedError('Usuário inativo ou bloqueado no sistema');
    }

    const isMatch = await this.hasher.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciais inválidas (email ou senha incorretos)');
    }

    user.recordLogin();
    await this.userRepository.update(user);

    const tokens = this.jwtService.generateTokens({
      userId: user.id,
      email: user.email.value,
      role: user.role,
      departmentId: user.departmentId,
    });

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: user.id,
        userEmail: user.email.value,
        action: AuditAction.USER_LOGIN,
        entityName: 'User',
        entityId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        role: user.role,
        departmentId: user.departmentId,
      },
      tokens,
    };
  }

  public async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string; expiresIn: string }> {
    const payload = this.jwtService.verifyRefreshToken(dto.refreshToken);
    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('Usuário inválido ou inativo');
    }

    const newTokens = this.jwtService.generateTokens({
      userId: user.id,
      email: user.email.value,
      role: user.role,
      departmentId: user.departmentId,
    });

    return {
      accessToken: newTokens.accessToken,
      expiresIn: newTokens.expiresIn,
    };
  }

  public async logout(
    token: string,
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    this.tokenBlacklist.revoke(token);
    const user = await this.userRepository.findById(userId);

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId,
        userEmail: user?.email.value,
        action: AuditAction.USER_LOGOUT,
        entityName: 'User',
        entityId: userId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );
  }

  public async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }

    const isMatch = await this.hasher.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError('A senha atual fornecida está incorreta');
    }

    if (dto.newPassword.length < 8) {
      throw new ValidationError('A nova senha deve possuir pelo menos 8 caracteres');
    }

    const newHash = await this.hasher.hash(dto.newPassword);
    user.updatePassword(newHash);
    await this.userRepository.update(user);
  }
}

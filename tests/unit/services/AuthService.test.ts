import { AuthService } from '../../../src/application/services/AuthService';
import { IUserRepository } from '../../../src/infrastructure/repositories/IUserRepository';
import { IAuditLogRepository } from '../../../src/infrastructure/repositories/IAuditLogRepository';
import { BcryptHasher } from '../../../src/infrastructure/security/BcryptHasher';
import { JwtService } from '../../../src/infrastructure/security/JwtService';
import { TokenBlacklist } from '../../../src/infrastructure/security/TokenBlacklist';
import { User } from '../../../src/domain/entities/User';
import { Email, CPF } from '../../../src/domain/value-objects';
import { UserRole, UserStatus } from '../../../src/domain/enums';
import { UnauthorizedError } from '../../../src/domain/exceptions';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockAuditRepo: jest.Mocked<IAuditLogRepository>;
  let hasher: BcryptHasher;
  let jwtService: JwtService;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByDepartment: jest.fn(),
      findByRole: jest.fn(),
      findDirectReports: jest.fn(),
      searchUsers: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockAuditRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      searchAuditLogs: jest.fn(),
      findByEntity: jest.fn(),
      save: jest.fn().mockImplementation((log) => Promise.resolve(log)),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    hasher = new BcryptHasher();
    jwtService = new JwtService();
    authService = new AuthService(
      mockUserRepo,
      mockAuditRepo,
      hasher,
      jwtService,
      TokenBlacklist.getInstance()
    );
  });

  it('deve autenticar usuário com sucesso quando credenciais forem válidas', async () => {
    const passwordHash = await hasher.hash('SenhaCorreta123');
    const user = new User({
      id: 'u-1',
      name: 'João Teste',
      email: new Email('joao@empresa.com'),
      passwordHash,
      cpf: new CPF('11144477735'),
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    });

    mockUserRepo.findByEmail.mockResolvedValue(user);
    mockUserRepo.update.mockResolvedValue(user);

    const result = await authService.login({
      email: 'joao@empresa.com',
      password: 'SenhaCorreta123',
    });

    expect(result.user.email).toBe('joao@empresa.com');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(mockUserRepo.update).toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedError quando senha for inválida', async () => {
    const passwordHash = await hasher.hash('SenhaCorreta123');
    const user = new User({
      id: 'u-1',
      name: 'João Teste',
      email: new Email('joao@empresa.com'),
      passwordHash,
      cpf: new CPF('11144477735'),
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    });

    mockUserRepo.findByEmail.mockResolvedValue(user);

    await expect(
      authService.login({
        email: 'joao@empresa.com',
        password: 'SenhaErrada',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});

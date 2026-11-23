import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, UserFilterParams } from '../../infrastructure/repositories/IUserRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/IAuditLogRepository';
import { BcryptHasher } from '../../infrastructure/security/BcryptHasher';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dtos/user.dto';
import { User } from '../../domain/entities/User';
import { Email, CPF, BankDetails } from '../../domain/value-objects';
import { ConflictError, NotFoundError } from '../../domain/exceptions';
import { AuditAction, UserStatus } from '../../domain/enums';
import { PaginatedResult } from '../../infrastructure/database/QueryBuilder';

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditRepository: IAuditLogRepository,
    private readonly hasher: BcryptHasher = new BcryptHasher()
  ) {}

  public async createUser(
    dto: CreateUserDto,
    authorId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<UserResponseDto> {
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError(`Já existe um usuário cadastrado com o email '${dto.email}'`);
    }

    const existingCpf = await this.userRepository.findByCpf(dto.cpf);
    if (existingCpf) {
      throw new ConflictError(`Já existe um usuário cadastrado com o CPF informado`);
    }

    const passwordHash = await this.hasher.hash(dto.password);
    const userId = uuidv4();

    let bankDetails: BankDetails | undefined;
    if (dto.bankDetails) {
      bankDetails = new BankDetails(dto.bankDetails);
    }

    const user = new User({
      id: userId,
      name: dto.name,
      email: new Email(dto.email),
      passwordHash,
      cpf: new CPF(dto.cpf),
      role: dto.role,
      status: UserStatus.ACTIVE,
      departmentId: dto.departmentId,
      managerId: dto.managerId,
      jobTitle: dto.jobTitle,
      phone: dto.phone,
      bankDetails,
    });

    const saved = await this.userRepository.save(user);

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: authorId,
        action: AuditAction.USER_CREATE,
        entityName: 'User',
        entityId: saved.id,
        newValues: saved.toJSON(),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(saved);
  }

  public async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário', id);
    }
    return this.mapToResponse(user);
  }

  public async searchUsers(filters: UserFilterParams): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.searchUsers(filters);
    return {
      data: result.data.map((u) => this.mapToResponse(u)),
      pagination: result.pagination,
    };
  }

  public async updateUser(
    id: string,
    dto: UpdateUserDto,
    authorId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário', id);
    }

    const oldValues = user.toJSON();

    if (dto.name !== undefined) user.updateProfile(dto.name, dto.jobTitle, dto.phone);
    if (dto.departmentId !== undefined) user.setDepartment(dto.departmentId);
    if (dto.managerId !== undefined) user.setManager(dto.managerId);
    if (dto.bankDetails !== undefined) user.updateBankDetails(new BankDetails(dto.bankDetails));

    const updated = await this.userRepository.update(user);

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: authorId,
        action: AuditAction.USER_UPDATE,
        entityName: 'User',
        entityId: updated.id,
        oldValues,
        newValues: updated.toJSON(),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(updated);
  }

  public async deactivateUser(id: string, authorId?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário', id);
    }

    user.changeStatus(UserStatus.INACTIVE);
    await this.userRepository.update(user);

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: authorId,
        action: AuditAction.USER_DEACTIVATE,
        entityName: 'User',
        entityId: user.id,
      })
    );
  }

  private mapToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      cpf: user.cpf.formatted,
      role: user.role,
      status: user.status,
      departmentId: user.departmentId,
      managerId: user.managerId,
      jobTitle: user.jobTitle,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bankDetails: user.bankDetails ? (user.bankDetails.toJSON() as any) : null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

import { BaseEntity } from './BaseEntity';
import { UserRole, UserStatus } from '../enums';
import { Email, CPF, BankDetails } from '../value-objects';
import { ValidationError } from '../exceptions';

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  cpf: CPF;
  role: UserRole;
  status?: UserStatus;
  departmentId?: string;
  managerId?: string;
  jobTitle?: string;
  bankDetails?: BankDetails;
  phone?: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  private _name: string;
  private _email: Email;
  private _passwordHash: string;
  private _cpf: CPF;
  private _role: UserRole;
  private _status: UserStatus;
  private _departmentId?: string;
  private _managerId?: string;
  private _jobTitle?: string;
  private _bankDetails?: BankDetails;
  private _phone?: string;
  private _avatarUrl?: string;
  private _lastLoginAt?: Date;

  constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.name || props.name.trim().length < 3) {
      throw new ValidationError('Nome de usuário deve ter no mínimo 3 caracteres');
    }
    this._name = props.name.trim();
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._cpf = props.cpf;
    this._role = props.role;
    this._status = props.status || UserStatus.ACTIVE;
    this._departmentId = props.departmentId;
    this._managerId = props.managerId;
    this._jobTitle = props.jobTitle;
    this._bankDetails = props.bankDetails;
    this._phone = props.phone;
    this._avatarUrl = props.avatarUrl;
    this._lastLoginAt = props.lastLoginAt;
  }

  public get name(): string {
    return this._name;
  }

  public get email(): Email {
    return this._email;
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public get cpf(): CPF {
    return this._cpf;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public get departmentId(): string | undefined {
    return this._departmentId;
  }

  public get managerId(): string | undefined {
    return this._managerId;
  }

  public get jobTitle(): string | undefined {
    return this._jobTitle;
  }

  public get bankDetails(): BankDetails | undefined {
    return this._bankDetails;
  }

  public get phone(): string | undefined {
    return this._phone;
  }

  public get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  public get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  public hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  public canApproveExpenses(): boolean {
    return [
      UserRole.MANAGER,
      UserRole.DIRECTOR,
      UserRole.VP,
      UserRole.FINANCIAL_MANAGER,
      UserRole.ADMIN,
    ].includes(this._role);
  }

  public updateProfile(name: string, jobTitle?: string, phone?: string): void {
    if (!name || name.trim().length < 3) {
      throw new ValidationError('Nome inválido para atualização de perfil');
    }
    this._name = name.trim();
    if (jobTitle !== undefined) this._jobTitle = jobTitle;
    if (phone !== undefined) this._phone = phone;
    this.touch();
  }

  public setDepartment(departmentId: string): void {
    this._departmentId = departmentId;
    this.touch();
  }

  public setManager(managerId: string): void {
    if (managerId === this._id) {
      throw new ValidationError('Um usuário não pode ser gestor de si mesmo');
    }
    this._managerId = managerId;
    this.touch();
  }

  public updateBankDetails(bankDetails: BankDetails): void {
    this._bankDetails = bankDetails;
    this.touch();
  }

  public changeRole(newRole: UserRole): void {
    this._role = newRole;
    this.touch();
  }

  public changeStatus(newStatus: UserStatus): void {
    this._status = newStatus;
    this.touch();
  }

  public updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash) {
      throw new ValidationError('Hash de senha inválido');
    }
    this._passwordHash = newPasswordHash;
    this.touch();
  }

  public recordLogin(): void {
    this._lastLoginAt = new Date();
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      email: this._email.value,
      cpf: this._cpf.formatted,
      role: this._role,
      status: this._status,
      departmentId: this._departmentId,
      managerId: this._managerId,
      jobTitle: this._jobTitle,
      phone: this._phone,
      avatarUrl: this._avatarUrl,
      bankDetails: this._bankDetails ? this._bankDetails.toJSON() : null,
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

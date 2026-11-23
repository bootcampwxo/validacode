import { UserRole, UserStatus, PaymentMethod } from '../../domain/enums';

export interface BankDetailsDto {
  bankCode: string;
  bankName: string;
  agencyNumber: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  pixKey?: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  preferredPaymentMethod: PaymentMethod;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  cpf: string;
  role: UserRole;
  departmentId?: string;
  managerId?: string;
  jobTitle?: string;
  phone?: string;
  bankDetails?: BankDetailsDto;
}

export interface UpdateUserDto {
  name?: string;
  jobTitle?: string;
  phone?: string;
  departmentId?: string;
  managerId?: string;
  bankDetails?: BankDetailsDto;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: string;
  managerId?: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  bankDetails?: BankDetailsDto | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

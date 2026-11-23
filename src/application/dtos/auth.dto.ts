import { UserRole } from '../../domain/enums';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    departmentId?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
  };
}

import { User } from '../../domain/entities/User';
import { IBaseRepository } from './IBaseRepository';
import { UserRole, UserStatus } from '../../domain/enums';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface UserFilterParams extends PaginationParams {
  role?: UserRole;
  status?: UserStatus;
  departmentId?: string;
  search?: string;
}

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  findByDepartment(departmentId: string): Promise<User[]>;
  findByRole(role: UserRole): Promise<User[]>;
  findDirectReports(managerId: string): Promise<User[]>;
  searchUsers(filters: UserFilterParams): Promise<PaginatedResult<User>>;
}

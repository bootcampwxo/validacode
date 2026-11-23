import { BaseEntity } from '../../domain/entities/BaseEntity';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface IBaseRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
  save(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

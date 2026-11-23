import { AuditLog } from '../../domain/entities/AuditLog';
import { IBaseRepository } from './IBaseRepository';
import { AuditAction } from '../../domain/enums';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface AuditLogFilterParams extends PaginationParams {
  userId?: string;
  action?: AuditAction;
  entityName?: string;
  entityId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface IAuditLogRepository extends IBaseRepository<AuditLog> {
  searchAuditLogs(filters: AuditLogFilterParams): Promise<PaginatedResult<AuditLog>>;
  findByEntity(entityName: string, entityId: string): Promise<AuditLog[]>;
}

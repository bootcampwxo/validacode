import { IAuditLogRepository, AuditLogFilterParams } from '../../infrastructure/repositories/IAuditLogRepository';
import { AuditLogResponseDto } from '../dtos/audit.dto';
import { AuditLog } from '../../domain/entities/AuditLog';
import { PaginatedResult } from '../../infrastructure/database/QueryBuilder';

export class AuditService {
  constructor(private readonly auditRepository: IAuditLogRepository) {}

  public async searchLogs(filters: AuditLogFilterParams): Promise<PaginatedResult<AuditLogResponseDto>> {
    const result = await this.auditRepository.searchAuditLogs(filters);
    return {
      data: result.data.map((l) => this.mapToResponse(l)),
      pagination: result.pagination,
    };
  }

  public async getEntityHistory(entityName: string, entityId: string): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditRepository.findByEntity(entityName, entityId);
    return logs.map((l) => this.mapToResponse(l));
  }

  private mapToResponse(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      userEmail: log.userEmail,
      action: log.action,
      entityName: log.entityName,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      createdAt: log.createdAt,
    };
  }
}

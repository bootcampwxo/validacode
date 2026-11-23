import { AuditAction } from '../../domain/enums';

export interface AuditLogResponseDto {
  id: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

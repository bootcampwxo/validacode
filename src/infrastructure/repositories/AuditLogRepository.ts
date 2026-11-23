import { BasePostgresRepository } from './BasePostgresRepository';
import { IAuditLogRepository, AuditLogFilterParams } from './IAuditLogRepository';
import { AuditLog } from '../../domain/entities/AuditLog';
import { AuditAction } from '../../domain/enums';
import { PaginatedResult, QueryBuilder } from '../database/QueryBuilder';

export class AuditLogRepository extends BasePostgresRepository<AuditLog> implements IAuditLogRepository {
  protected readonly tableName = 'audit_logs';

  protected mapToEntity(row: any): AuditLog {
    return new AuditLog({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action as AuditAction,
      entityName: row.entity_name,
      entityId: row.entity_id,
      oldValues: row.old_values,
      newValues: row.new_values,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
    });
  }

  protected mapToRow(entity: AuditLog): Record<string, any> {
    return {
      id: entity.id,
      user_id: entity.userId || null,
      user_email: entity.userEmail || null,
      action: entity.action,
      entity_name: entity.entityName,
      entity_id: entity.entityId || null,
      old_values: entity.oldValues ? JSON.stringify(entity.oldValues) : null,
      new_values: entity.newValues ? JSON.stringify(entity.newValues) : null,
      ip_address: entity.ipAddress || null,
      user_agent: entity.userAgent || null,
      metadata: JSON.stringify(entity.metadata),
      created_at: entity.createdAt,
    };
  }

  public async searchAuditLogs(filters: AuditLogFilterParams): Promise<PaginatedResult<AuditLog>> {
    const qb = QueryBuilder.table(this.tableName);

    if (filters.userId) qb.whereEquals('user_id', filters.userId);
    if (filters.action) qb.whereEquals('action', filters.action);
    if (filters.entityName) qb.whereEquals('entity_name', filters.entityName);
    if (filters.entityId) qb.whereEquals('entity_id', filters.entityId);
    if (filters.startDate && filters.endDate) {
      qb.whereBetween('created_at', filters.startDate, filters.endDate);
    }

    qb.paginate(filters);
    const { sql, countSql, params } = qb.buildSelect();

    const countResult = await this.db.query(countSql, params.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const rowsResult = await this.db.query(sql, params);
    const data = rowsResult.rows.map((r) => this.mapToEntity(r));

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async findByEntity(entityName: string, entityId: string): Promise<AuditLog[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE entity_name = $1 AND entity_id = $2 ORDER BY created_at DESC`;
    const result = await this.db.query(sql, [entityName, entityId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: AuditLog): Promise<AuditLog> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, user_id, user_email, action, entity_name, entity_id,
        old_values, new_values, ip_address, user_agent, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.user_id,
      row.user_email,
      row.action,
      row.entity_name,
      row.entity_id,
      row.old_values,
      row.new_values,
      row.ip_address,
      row.user_agent,
      row.metadata,
      row.created_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: AuditLog): Promise<AuditLog> {
    return entity;
  }
}

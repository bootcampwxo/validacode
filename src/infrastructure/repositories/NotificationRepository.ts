import { BasePostgresRepository } from './BasePostgresRepository';
import { INotificationRepository } from './INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/enums';
import { PaginatedResult, PaginationParams, QueryBuilder } from '../database/QueryBuilder';

export class NotificationRepository
  extends BasePostgresRepository<Notification>
  implements INotificationRepository
{
  protected readonly tableName = 'notifications';

  protected mapToEntity(row: any): Notification {
    return new Notification({
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      data: row.data || {},
      isRead: row.is_read,
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      isEmailSent: row.is_email_sent,
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: Notification): Record<string, any> {
    return {
      id: entity.id,
      user_id: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      data: JSON.stringify(entity.data),
      is_read: entity.isRead,
      read_at: entity.readAt || null,
      is_email_sent: entity.isEmailSent,
      email_sent_at: entity.emailSentAt || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByUserId(
    userId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Notification>> {
    const qb = QueryBuilder.table(this.tableName)
      .whereEquals('user_id', userId)
      .paginate(params);

    const { sql, countSql, params: queryParams } = qb.buildSelect();
    const countResult = await this.db.query(countSql, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const rowsResult = await this.db.query(sql, queryParams);
    const data = rowsResult.rows.map((r) => this.mapToEntity(r));

    const page = params?.page || 1;
    const limit = params?.limit || 20;
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

  public async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC`;
    const result = await this.db.query(sql, [userId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async countUnreadByUserId(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*) AS total FROM ${this.tableName} WHERE user_id = $1 AND is_read = false`;
    const result = await this.db.query(sql, [userId]);
    return parseInt(result.rows[0]?.total || '0', 10);
  }

  public async markAllAsReadByUserId(userId: string): Promise<number> {
    const sql = `
      UPDATE ${this.tableName} SET
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await this.db.query(sql, [userId]);
    return result.rowCount || 0;
  }

  public async findPendingEmailNotifications(limit = 50): Promise<Notification[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE is_email_sent = false
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await this.db.query(sql, [limit]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: Notification): Promise<Notification> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, user_id, type, title, message, data, is_read,
        read_at, is_email_sent, email_sent_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.user_id,
      row.type,
      row.title,
      row.message,
      row.data,
      row.is_read,
      row.read_at,
      row.is_email_sent,
      row.email_sent_at,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: Notification): Promise<Notification> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        is_read = $2,
        read_at = $3,
        is_email_sent = $4,
        email_sent_at = $5,
        updated_at = $6
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.is_read,
      row.read_at,
      row.is_email_sent,
      row.email_sent_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

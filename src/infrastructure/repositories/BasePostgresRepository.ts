import { BaseEntity } from '../../domain/entities/BaseEntity';
import { IBaseRepository } from './IBaseRepository';
import { DatabasePool } from '../database/DatabasePool';
import { QueryBuilder, PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export abstract class BasePostgresRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected readonly db: DatabasePool;
  protected abstract readonly tableName: string;

  constructor(db?: DatabasePool) {
    this.db = db || DatabasePool.getInstance();
  }

  protected abstract mapToEntity(row: any): T;
  protected abstract mapToRow(entity: T): Record<string, any>;

  public async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.db.query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findAll(params?: PaginationParams): Promise<PaginatedResult<T>> {
    const qb = QueryBuilder.table(this.tableName).paginate(params);
    const { sql, countSql, params: queryParams } = qb.buildSelect();

    const countResult = await this.db.query(countSql, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const rowsResult = await this.db.query(sql, queryParams);
    const data = rowsResult.rows.map((row) => this.mapToEntity(row));

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

  public async exists(id: string): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.db.query(sql, [id]);
    return result.rows.length > 0;
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  public abstract save(entity: T): Promise<T>;
  public abstract update(entity: T): Promise<T>;
}

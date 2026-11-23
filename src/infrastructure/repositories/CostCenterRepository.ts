import { BasePostgresRepository } from './BasePostgresRepository';
import { ICostCenterRepository } from './ICostCenterRepository';
import { CostCenter } from '../../domain/entities/CostCenter';

export class CostCenterRepository extends BasePostgresRepository<CostCenter> implements ICostCenterRepository {
  protected readonly tableName = 'cost_centers';

  protected mapToEntity(row: any): CostCenter {
    return new CostCenter({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      managerId: row.manager_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: CostCenter): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description || null,
      manager_id: entity.managerId || null,
      is_active: entity.isActive,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<CostCenter | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findActiveCostCenters(): Promise<CostCenter[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY code ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: CostCenter): Promise<CostCenter> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, name, description, manager_id, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.name,
      row.description,
      row.manager_id,
      row.is_active,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: CostCenter): Promise<CostCenter> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        name = $2,
        description = $3,
        manager_id = $4,
        is_active = $5,
        updated_at = $6
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.description,
      row.manager_id,
      row.is_active,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

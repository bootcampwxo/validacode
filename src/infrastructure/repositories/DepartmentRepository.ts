import { BasePostgresRepository } from './BasePostgresRepository';
import { IDepartmentRepository } from './IDepartmentRepository';
import { Department } from '../../domain/entities/Department';

export class DepartmentRepository extends BasePostgresRepository<Department> implements IDepartmentRepository {
  protected readonly tableName = 'departments';

  protected mapToEntity(row: any): Department {
    return new Department({
      id: row.id,
      code: row.code,
      name: row.name,
      managerId: row.manager_id,
      directorId: row.director_id,
      costCenterId: row.cost_center_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: Department): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      manager_id: entity.managerId || null,
      director_id: entity.directorId || null,
      cost_center_id: entity.costCenterId || null,
      is_active: entity.isActive,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<Department | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findActiveDepartments(): Promise<Department[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY name ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByCostCenter(costCenterId: string): Promise<Department[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE cost_center_id = $1 ORDER BY name ASC`;
    const result = await this.db.query(sql, [costCenterId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: Department): Promise<Department> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, name, manager_id, director_id, cost_center_id, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.name,
      row.manager_id,
      row.director_id,
      row.cost_center_id,
      row.is_active,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: Department): Promise<Department> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        name = $2,
        manager_id = $3,
        director_id = $4,
        cost_center_id = $5,
        is_active = $6,
        updated_at = $7
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.manager_id,
      row.director_id,
      row.cost_center_id,
      row.is_active,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

import { BasePostgresRepository } from './BasePostgresRepository';
import { IExpenseCategoryRepository } from './IExpenseCategoryRepository';
import { ExpenseCategory } from '../../domain/entities/ExpenseCategory';
import { CategoryType } from '../../domain/enums';
import { Money } from '../../domain/value-objects';

export class ExpenseCategoryRepository
  extends BasePostgresRepository<ExpenseCategory>
  implements IExpenseCategoryRepository
{
  protected readonly tableName = 'expense_categories';

  protected mapToEntity(row: any): ExpenseCategory {
    return new ExpenseCategory({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type as CategoryType,
      description: row.description,
      maxLimitPerExpense: row.max_limit_per_expense_cents
        ? Money.fromCents(parseInt(row.max_limit_per_expense_cents, 10))
        : undefined,
      maxDailyLimit: row.max_daily_limit_cents
        ? Money.fromCents(parseInt(row.max_daily_limit_cents, 10))
        : undefined,
      requiresReceipt: row.requires_receipt,
      requiresItemization: row.requires_itemization,
      requiresJustification: row.requires_justification,
      mileageRatePerKm: row.mileage_rate_per_km ? parseFloat(row.mileage_rate_per_km) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: ExpenseCategory): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      type: entity.type,
      description: entity.description || null,
      max_limit_per_expense_cents: entity.maxLimitPerExpense
        ? entity.maxLimitPerExpense.amountInCents
        : null,
      max_daily_limit_cents: entity.maxDailyLimit
        ? entity.maxDailyLimit.amountInCents
        : null,
      requires_receipt: entity.requiresReceipt,
      requires_itemization: entity.requiresItemization,
      requires_justification: entity.requiresJustification,
      mileage_rate_per_km: entity.mileageRatePerKm || null,
      is_active: entity.isActive,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<ExpenseCategory | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByType(type: CategoryType): Promise<ExpenseCategory[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE type = $1 AND is_active = true ORDER BY name ASC`;
    const result = await this.db.query(sql, [type]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findActiveCategories(): Promise<ExpenseCategory[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY name ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: ExpenseCategory): Promise<ExpenseCategory> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, name, type, description,
        max_limit_per_expense_cents, max_daily_limit_cents,
        requires_receipt, requires_itemization, requires_justification,
        mileage_rate_per_km, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.name,
      row.type,
      row.description,
      row.max_limit_per_expense_cents,
      row.max_daily_limit_cents,
      row.requires_receipt,
      row.requires_itemization,
      row.requires_justification,
      row.mileage_rate_per_km,
      row.is_active,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: ExpenseCategory): Promise<ExpenseCategory> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        name = $2,
        type = $3,
        description = $4,
        max_limit_per_expense_cents = $5,
        max_daily_limit_cents = $6,
        requires_receipt = $7,
        requires_itemization = $8,
        requires_justification = $9,
        mileage_rate_per_km = $10,
        is_active = $11,
        updated_at = $12
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.type,
      row.description,
      row.max_limit_per_expense_cents,
      row.max_daily_limit_cents,
      row.requires_receipt,
      row.requires_itemization,
      row.requires_justification,
      row.mileage_rate_per_km,
      row.is_active,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

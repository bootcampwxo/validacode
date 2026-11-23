import { BasePostgresRepository } from './BasePostgresRepository';
import { IBudgetRepository } from './IBudgetRepository';
import { Budget } from '../../domain/entities/Budget';
import { Money } from '../../domain/value-objects';
import { Currency } from '../../domain/enums';

export class BudgetRepository extends BasePostgresRepository<Budget> implements IBudgetRepository {
  protected readonly tableName = 'budgets';

  protected mapToEntity(row: any): Budget {
    const currency = (row.currency || Currency.BRL) as Currency;
    return new Budget({
      id: row.id,
      costCenterId: row.cost_center_id,
      year: row.year,
      month: row.month || undefined,
      allocatedAmount: Money.fromCents(parseInt(row.allocated_amount_cents, 10), currency),
      consumedAmount: Money.fromCents(parseInt(row.consumed_amount_cents || '0', 10), currency),
      reservedAmount: Money.fromCents(parseInt(row.reserved_amount_cents || '0', 10), currency),
      alertThresholdPercentage: row.alert_threshold_percentage,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: Budget): Record<string, any> {
    return {
      id: entity.id,
      cost_center_id: entity.costCenterId,
      year: entity.year,
      month: entity.month || null,
      allocated_amount_cents: entity.allocatedAmount.amountInCents,
      consumed_amount_cents: entity.consumedAmount.amountInCents,
      reserved_amount_cents: entity.reservedAmount.amountInCents,
      currency: entity.allocatedAmount.currency,
      alert_threshold_percentage: 80,
      is_active: true,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCostCenterAndPeriod(
    costCenterId: string,
    year: number,
    month?: number
  ): Promise<Budget | null> {
    let sql: string;
    let params: unknown[];

    if (month !== undefined) {
      sql = `SELECT * FROM ${this.tableName} WHERE cost_center_id = $1 AND year = $2 AND month = $3 LIMIT 1`;
      params = [costCenterId, year, month];
    } else {
      sql = `SELECT * FROM ${this.tableName} WHERE cost_center_id = $1 AND year = $2 AND month IS NULL LIMIT 1`;
      params = [costCenterId, year];
    }

    const result = await this.db.query(sql, params);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findBudgetsByYear(year: number): Promise<Budget[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE year = $1 AND is_active = true`;
    const result = await this.db.query(sql, [year]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: Budget): Promise<Budget> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, cost_center_id, year, month, allocated_amount_cents,
        consumed_amount_cents, reserved_amount_cents, currency,
        alert_threshold_percentage, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.cost_center_id,
      row.year,
      row.month,
      row.allocated_amount_cents,
      row.consumed_amount_cents,
      row.reserved_amount_cents,
      row.currency,
      row.alert_threshold_percentage,
      row.is_active,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: Budget): Promise<Budget> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        allocated_amount_cents = $2,
        consumed_amount_cents = $3,
        reserved_amount_cents = $4,
        alert_threshold_percentage = $5,
        is_active = $6,
        updated_at = $7
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.allocated_amount_cents,
      row.consumed_amount_cents,
      row.reserved_amount_cents,
      row.alert_threshold_percentage,
      row.is_active,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

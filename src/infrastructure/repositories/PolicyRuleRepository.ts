import { BasePostgresRepository } from './BasePostgresRepository';
import { IPolicyRuleRepository } from './IPolicyRuleRepository';
import { PolicyRule } from '../../domain/entities/PolicyRule';
import { PolicyViolationType, PolicySeverity, CategoryType } from '../../domain/enums';
import { Money } from '../../domain/value-objects';

export class PolicyRuleRepository
  extends BasePostgresRepository<PolicyRule>
  implements IPolicyRuleRepository
{
  protected readonly tableName = 'policy_rules';

  protected mapToEntity(row: any): PolicyRule {
    return new PolicyRule({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      violationType: row.violation_type as PolicyViolationType,
      severity: row.severity as PolicySeverity,
      categoryType: row.category_type as CategoryType | undefined,
      categoryId: row.category_id || undefined,
      maxAmount: row.max_amount_cents ? Money.fromCents(parseInt(row.max_amount_cents, 10)) : undefined,
      maxDailyAmount: row.max_daily_amount_cents
        ? Money.fromCents(parseInt(row.max_daily_amount_cents, 10))
        : undefined,
      maxAgeInDays: row.max_age_in_days,
      requiresReceipt: row.requires_receipt,
      requiresJustification: row.requires_justification,
      allowWeekend: row.allow_weekend,
      allowAlcohol: row.allow_alcohol,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: PolicyRule): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description || null,
      violation_type: entity.violationType,
      severity: entity.severity,
      category_type: entity.categoryType || null,
      category_id: entity.categoryId || null,
      max_amount_cents: entity.maxAmount ? entity.maxAmount.amountInCents : null,
      max_daily_amount_cents: entity.maxDailyAmount ? entity.maxDailyAmount.amountInCents : null,
      max_age_in_days: entity.maxAgeInDays || null,
      requires_receipt: entity.requiresReceipt ?? null,
      requires_justification: entity.requiresJustification ?? null,
      allow_weekend: entity.allowWeekend ?? null,
      allow_alcohol: entity.allowAlcohol ?? null,
      is_active: entity.isActive,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<PolicyRule | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findActiveRules(): Promise<PolicyRule[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY code ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByCategoryType(type: CategoryType): Promise<PolicyRule[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE category_type = $1 AND is_active = true`;
    const result = await this.db.query(sql, [type]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByViolationType(violationType: PolicyViolationType): Promise<PolicyRule[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE violation_type = $1 AND is_active = true`;
    const result = await this.db.query(sql, [violationType]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: PolicyRule): Promise<PolicyRule> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, name, description, violation_type, severity,
        category_type, category_id, max_amount_cents, max_daily_amount_cents,
        max_age_in_days, requires_receipt, requires_justification,
        allow_weekend, allow_alcohol, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.name,
      row.description,
      row.violation_type,
      row.severity,
      row.category_type,
      row.category_id,
      row.max_amount_cents,
      row.max_daily_amount_cents,
      row.max_age_in_days,
      row.requires_receipt,
      row.requires_justification,
      row.allow_weekend,
      row.allow_alcohol,
      row.is_active,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: PolicyRule): Promise<PolicyRule> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        name = $2,
        description = $3,
        severity = $4,
        max_amount_cents = $5,
        max_daily_amount_cents = $6,
        max_age_in_days = $7,
        requires_receipt = $8,
        requires_justification = $9,
        allow_weekend = $10,
        allow_alcohol = $11,
        is_active = $12,
        updated_at = $13
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.name,
      row.description,
      row.severity,
      row.max_amount_cents,
      row.max_daily_amount_cents,
      row.max_age_in_days,
      row.requires_receipt,
      row.requires_justification,
      row.allow_weekend,
      row.allow_alcohol,
      row.is_active,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

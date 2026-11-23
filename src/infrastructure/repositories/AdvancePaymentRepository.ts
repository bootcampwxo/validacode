import { BasePostgresRepository } from './BasePostgresRepository';
import { IAdvancePaymentRepository, AdvanceFilterParams } from './IAdvancePaymentRepository';
import { AdvancePayment } from '../../domain/entities/AdvancePayment';
import { AdvanceStatus, Currency } from '../../domain/enums';
import { Money } from '../../domain/value-objects';
import { PaginatedResult, QueryBuilder } from '../database/QueryBuilder';

export class AdvancePaymentRepository
  extends BasePostgresRepository<AdvancePayment>
  implements IAdvancePaymentRepository
{
  protected readonly tableName = 'advance_payments';

  protected mapToEntity(row: any): AdvancePayment {
    const currency = (row.currency || Currency.BRL) as Currency;
    return new AdvancePayment({
      id: row.id,
      code: row.code,
      userId: row.user_id,
      departmentId: row.department_id,
      costCenterId: row.cost_center_id,
      purpose: row.purpose,
      requestedAmount: Money.fromCents(parseInt(row.requested_amount_cents, 10), currency),
      approvedAmount: row.approved_amount_cents
        ? Money.fromCents(parseInt(row.approved_amount_cents, 10), currency)
        : undefined,
      currency,
      status: row.status as AdvanceStatus,
      requestDate: new Date(row.request_date),
      expectedReconciliationDate: new Date(row.expected_reconciliation_date),
      actualReconciliationDate: row.actual_reconciliation_date
        ? new Date(row.actual_reconciliation_date)
        : undefined,
      approvedById: row.approved_by_id,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      disbursedAt: row.disbursed_at ? new Date(row.disbursed_at) : undefined,
      rejectionReason: row.rejection_reason,
      reconciledExpenseId: row.reconciled_expense_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: AdvancePayment): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      user_id: entity.userId,
      department_id: entity.departmentId,
      cost_center_id: entity.costCenterId,
      purpose: entity.purpose,
      requested_amount_cents: entity.requestedAmount.amountInCents,
      approved_amount_cents: entity.approvedAmount ? entity.approvedAmount.amountInCents : null,
      currency: entity.currency,
      status: entity.status,
      request_date: entity.requestDate,
      expected_reconciliation_date: entity.expectedReconciliationDate,
      actual_reconciliation_date: entity.actualReconciliationDate || null,
      approved_by_id: entity.approvedById || null,
      approved_at: entity.approvedAt || null,
      disbursed_at: entity.disbursedAt || null,
      rejection_reason: entity.rejectionReason || null,
      reconciled_expense_id: entity.reconciledExpenseId || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<AdvancePayment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByUserId(userId: string): Promise<AdvancePayment[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await this.db.query(sql, [userId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findPendingAdvances(): Promise<AdvancePayment[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE status = 'PENDING' ORDER BY created_at ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async searchAdvances(filters: AdvanceFilterParams): Promise<PaginatedResult<AdvancePayment>> {
    const qb = QueryBuilder.table(this.tableName);

    if (filters.userId) qb.whereEquals('user_id', filters.userId);
    if (filters.departmentId) qb.whereEquals('department_id', filters.departmentId);
    if (filters.costCenterId) qb.whereEquals('cost_center_id', filters.costCenterId);
    if (filters.status) qb.whereEquals('status', filters.status);

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

  public async generateNextCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const countSql = `SELECT COUNT(*) AS total FROM ${this.tableName} WHERE EXTRACT(YEAR FROM created_at) = $1`;
    const res = await this.db.query(countSql, [currentYear]);
    const nextNum = parseInt(res.rows[0]?.total || '0', 10) + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `ADV-${currentYear}-${padded}`;
  }

  public async save(entity: AdvancePayment): Promise<AdvancePayment> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, user_id, department_id, cost_center_id, purpose,
        requested_amount_cents, approved_amount_cents, currency, status,
        request_date, expected_reconciliation_date, actual_reconciliation_date,
        approved_by_id, approved_at, disbursed_at, rejection_reason,
        reconciled_expense_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.user_id,
      row.department_id,
      row.cost_center_id,
      row.purpose,
      row.requested_amount_cents,
      row.approved_amount_cents,
      row.currency,
      row.status,
      row.request_date,
      row.expected_reconciliation_date,
      row.actual_reconciliation_date,
      row.approved_by_id,
      row.approved_at,
      row.disbursed_at,
      row.rejection_reason,
      row.reconciled_expense_id,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: AdvancePayment): Promise<AdvancePayment> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        approved_amount_cents = $2,
        status = $3,
        expected_reconciliation_date = $4,
        actual_reconciliation_date = $5,
        approved_by_id = $6,
        approved_at = $7,
        disbursed_at = $8,
        rejection_reason = $9,
        reconciled_expense_id = $10,
        updated_at = $11
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.approved_amount_cents,
      row.status,
      row.expected_reconciliation_date,
      row.actual_reconciliation_date,
      row.approved_by_id,
      row.approved_at,
      row.disbursed_at,
      row.rejection_reason,
      row.reconciled_expense_id,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

import { BasePostgresRepository } from './BasePostgresRepository';
import { IReimbursementBatchRepository } from './IReimbursementBatchRepository';
import { ReimbursementBatch } from '../../domain/entities/ReimbursementBatch';
import { ReimbursementPayment } from '../../domain/entities/ReimbursementPayment';
import { PaymentStatus, PaymentMethod, Currency } from '../../domain/enums';
import { Money, BankDetails } from '../../domain/value-objects';

export class ReimbursementBatchRepository
  extends BasePostgresRepository<ReimbursementBatch>
  implements IReimbursementBatchRepository
{
  protected readonly tableName = 'reimbursement_batches';

  protected mapToEntity(row: any, payments: ReimbursementPayment[] = []): ReimbursementBatch {
    return new ReimbursementBatch({
      id: row.id,
      batchCode: row.batch_code,
      description: row.description,
      status: row.status as PaymentStatus,
      totalAmount: Money.fromCents(parseInt(row.total_amount_cents, 10)),
      totalExpensesCount: row.total_expenses_count,
      scheduledDate: row.scheduled_date ? new Date(row.scheduled_date) : undefined,
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      processedById: row.processed_by_id,
      payments,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: ReimbursementBatch): Record<string, any> {
    return {
      id: entity.id,
      batch_code: entity.batchCode,
      description: entity.description || null,
      status: entity.status,
      total_amount_cents: entity.totalAmount.amountInCents,
      total_expenses_count: entity.totalExpensesCount,
      scheduled_date: entity.scheduledDate || null,
      processed_at: entity.processedAt || null,
      processed_by_id: entity.processedById || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByBatchCode(code: string): Promise<ReimbursementBatch | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(batch_code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.findWithPayments(result.rows[0].id);
  }

  public async findPendingBatches(): Promise<ReimbursementBatch[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE status IN ('PENDING', 'SCHEDULED') ORDER BY created_at ASC`;
    const result = await this.db.query(sql);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByStatus(status: PaymentStatus): Promise<ReimbursementBatch[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`;
    const result = await this.db.query(sql, [status]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findWithPayments(id: string): Promise<ReimbursementBatch | null> {
    const batchRes = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`, [id]);
    if (batchRes.rows.length === 0) return null;

    const paymentsRes = await this.db.query(
      `SELECT * FROM reimbursement_payments WHERE batch_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const payments = paymentsRes.rows.map((row) => {
      let bankDetails: BankDetails | undefined;
      if (row.bank_details_snapshot) {
        bankDetails = new BankDetails({
          bankCode: row.bank_details_snapshot.bankCode,
          bankName: row.bank_details_snapshot.bankName,
          agencyNumber: row.bank_details_snapshot.agencyNumber,
          accountNumber: row.bank_details_snapshot.accountNumber,
          accountType: row.bank_details_snapshot.accountType,
          pixKey: row.bank_details_snapshot.pixKey,
          pixKeyType: row.bank_details_snapshot.pixKeyType,
          preferredPaymentMethod: row.bank_details_snapshot.preferredPaymentMethod,
        });
      }

      return new ReimbursementPayment({
        id: row.id,
        batchId: row.batch_id,
        expenseId: row.expense_id,
        recipientId: row.recipient_id,
        amount: Money.fromCents(parseInt(row.amount_cents, 10), (row.currency || Currency.BRL) as Currency),
        paymentMethod: row.payment_method as PaymentMethod,
        bankDetailsSnapshot: bankDetails,
        status: row.status as PaymentStatus,
        transactionReference: row.transaction_reference,
        receiptNumber: row.receipt_number,
        failureReason: row.failure_reason,
        executedAt: row.executed_at ? new Date(row.executed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });

    return this.mapToEntity(batchRes.rows[0], payments);
  }

  public async generateNextBatchCode(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM reimbursement_batches
      WHERE batch_code LIKE $1
    `;
    const res = await this.db.query(countSql, [`BATCH-${yearMonth}-%`]);
    const nextNum = parseInt(res.rows[0]?.total || '0', 10) + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `BATCH-${yearMonth}-${padded}`;
  }

  public async save(entity: ReimbursementBatch): Promise<ReimbursementBatch> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, batch_code, description, status, total_amount_cents,
        total_expenses_count, scheduled_date, processed_at, processed_by_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.batch_code,
      row.description,
      row.status,
      row.total_amount_cents,
      row.total_expenses_count,
      row.scheduled_date,
      row.processed_at,
      row.processed_by_id,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0], entity.payments);
  }

  public async update(entity: ReimbursementBatch): Promise<ReimbursementBatch> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        description = $2,
        status = $3,
        total_amount_cents = $4,
        total_expenses_count = $5,
        scheduled_date = $6,
        processed_at = $7,
        processed_by_id = $8,
        updated_at = $9
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.description,
      row.status,
      row.total_amount_cents,
      row.total_expenses_count,
      row.scheduled_date,
      row.processed_at,
      row.processed_by_id,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0], entity.payments);
  }
}

import { BasePostgresRepository } from './BasePostgresRepository';
import { IReimbursementPaymentRepository } from './IReimbursementPaymentRepository';
import { ReimbursementPayment } from '../../domain/entities/ReimbursementPayment';
import { PaymentStatus, PaymentMethod, Currency } from '../../domain/enums';
import { Money, BankDetails } from '../../domain/value-objects';

export class ReimbursementPaymentRepository
  extends BasePostgresRepository<ReimbursementPayment>
  implements IReimbursementPaymentRepository
{
  protected readonly tableName = 'reimbursement_payments';

  protected mapToEntity(row: any): ReimbursementPayment {
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
  }

  protected mapToRow(entity: ReimbursementPayment): Record<string, any> {
    return {
      id: entity.id,
      batch_id: entity.batchId || null,
      expense_id: entity.expenseId,
      recipient_id: entity.recipientId,
      amount_cents: entity.amount.amountInCents,
      currency: entity.amount.currency,
      payment_method: entity.paymentMethod,
      bank_details_snapshot: entity.bankDetailsSnapshot
        ? JSON.stringify(entity.bankDetailsSnapshot.toJSON())
        : null,
      status: entity.status,
      transaction_reference: entity.transactionReference || null,
      receipt_number: entity.receiptNumber || null,
      failure_reason: entity.failureReason || null,
      executed_at: entity.executedAt || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByExpenseId(expenseId: string): Promise<ReimbursementPayment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE expense_id = $1 LIMIT 1`;
    const result = await this.db.query(sql, [expenseId]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByRecipientId(recipientId: string): Promise<ReimbursementPayment[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE recipient_id = $1 ORDER BY created_at DESC`;
    const result = await this.db.query(sql, [recipientId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByBatchId(batchId: string): Promise<ReimbursementPayment[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE batch_id = $1 ORDER BY created_at ASC`;
    const result = await this.db.query(sql, [batchId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByStatus(status: PaymentStatus): Promise<ReimbursementPayment[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at ASC`;
    const result = await this.db.query(sql, [status]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async save(entity: ReimbursementPayment): Promise<ReimbursementPayment> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, batch_id, expense_id, recipient_id, amount_cents, currency,
        payment_method, bank_details_snapshot, status, transaction_reference,
        receipt_number, failure_reason, executed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.batch_id,
      row.expense_id,
      row.recipient_id,
      row.amount_cents,
      row.currency,
      row.payment_method,
      row.bank_details_snapshot,
      row.status,
      row.transaction_reference,
      row.receipt_number,
      row.failure_reason,
      row.executed_at,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: ReimbursementPayment): Promise<ReimbursementPayment> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        batch_id = $2,
        status = $3,
        transaction_reference = $4,
        receipt_number = $5,
        failure_reason = $6,
        executed_at = $7,
        updated_at = $8
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.batch_id,
      row.status,
      row.transaction_reference,
      row.receipt_number,
      row.failure_reason,
      row.executed_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

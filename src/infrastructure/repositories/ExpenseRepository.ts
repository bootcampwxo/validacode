import { BasePostgresRepository } from './BasePostgresRepository';
import { IExpenseRepository, ExpenseFilterParams } from './IExpenseRepository';
import { Expense } from '../../domain/entities/Expense';
import { ExpenseItem } from '../../domain/entities/ExpenseItem';
import { ExpenseReceipt } from '../../domain/entities/ExpenseReceipt';
import { ExpenseStatus, Currency } from '../../domain/enums';
import { Money } from '../../domain/value-objects';
import { PaginatedResult, QueryBuilder } from '../database/QueryBuilder';

export class ExpenseRepository extends BasePostgresRepository<Expense> implements IExpenseRepository {
  protected readonly tableName = 'expenses';

  protected mapToEntity(row: any, items: ExpenseItem[] = [], receipts: ExpenseReceipt[] = []): Expense {
    const currency = (row.currency || Currency.BRL) as Currency;
    return new Expense({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      userId: row.user_id,
      departmentId: row.department_id,
      costCenterId: row.cost_center_id,
      status: row.status as ExpenseStatus,
      currency,
      totalAmount: Money.fromCents(parseInt(row.total_amount_cents, 10), currency),
      reimbursableAmount: Money.fromCents(parseInt(row.reimbursable_amount_cents, 10), currency),
      advancePaymentId: row.advance_payment_id,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
      rejectionReason: row.rejection_reason,
      revisionNotes: row.revision_notes,
      items,
      receipts,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: Expense): Record<string, any> {
    return {
      id: entity.id,
      code: entity.code,
      title: entity.title,
      description: entity.description || null,
      user_id: entity.userId,
      department_id: entity.departmentId,
      cost_center_id: entity.costCenterId,
      status: entity.status,
      currency: entity.currency,
      total_amount_cents: entity.totalAmount.amountInCents,
      reimbursable_amount_cents: entity.reimbursableAmount.amountInCents,
      advance_payment_id: entity.advancePaymentId || null,
      submitted_at: entity.submittedAt || null,
      approved_at: entity.approvedAt || null,
      paid_at: entity.paidAt || null,
      rejected_at: entity.rejectedAt || null,
      rejection_reason: entity.rejectionReason || null,
      revision_notes: entity.revisionNotes || null,
      metadata: JSON.stringify(entity.metadata),
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByCode(code: string): Promise<Expense | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) LIMIT 1`;
    const result = await this.db.query(sql, [code.trim()]);
    if (result.rows.length === 0) return null;
    return this.findWithDetails(result.rows[0].id);
  }

  public async findWithDetails(id: string): Promise<Expense | null> {
    const expenseRes = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`, [id]);
    if (expenseRes.rows.length === 0) return null;

    const itemsRes = await this.db.query(
      `SELECT * FROM expense_items WHERE expense_id = $1 ORDER BY expense_date ASC, created_at ASC`,
      [id]
    );

    const receiptsRes = await this.db.query(
      `SELECT * FROM expense_receipts WHERE expense_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const items = itemsRes.rows.map((row) => {
      const currency = (row.currency || Currency.BRL) as Currency;
      return new ExpenseItem({
        id: row.id,
        expenseId: row.expense_id,
        categoryId: row.category_id,
        description: row.description,
        amount: Money.fromCents(parseInt(row.amount_cents, 10), currency),
        expenseDate: new Date(row.expense_date),
        merchantName: row.merchant_name,
        merchantTaxId: row.merchant_tax_id,
        invoiceNumber: row.invoice_number,
        kilometers: row.kilometers ? parseFloat(row.kilometers) : undefined,
        participantsCount: row.participants_count,
        participantsNames: row.participants_names,
        justification: row.justification,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });

    const receipts = receiptsRes.rows.map((row) => {
      return new ExpenseReceipt({
        id: row.id,
        expenseId: row.expense_id,
        expenseItemId: row.expense_item_id,
        originalFileName: row.original_file_name,
        storedFileName: row.stored_file_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        fileHash: row.file_hash,
        ocrExtractedText: row.ocr_extracted_text,
        ocrExtractedAmount: row.ocr_extracted_amount_cents
          ? parseInt(row.ocr_extracted_amount_cents, 10) / 100
          : undefined,
        ocrExtractedDate: row.ocr_extracted_date ? new Date(row.ocr_extracted_date) : undefined,
        ocrExtractedCnpj: row.ocr_extracted_cnpj,
        isVerified: row.is_verified,
        uploadedById: row.uploaded_by_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    });

    return this.mapToEntity(expenseRes.rows[0], items, receipts);
  }

  public async searchExpenses(filters: ExpenseFilterParams): Promise<PaginatedResult<Expense>> {
    const qb = QueryBuilder.table(this.tableName);

    if (filters.userId) qb.whereEquals('user_id', filters.userId);
    if (filters.departmentId) qb.whereEquals('department_id', filters.departmentId);
    if (filters.costCenterId) qb.whereEquals('cost_center_id', filters.costCenterId);

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        qb.whereIn('status', filters.status);
      } else {
        qb.whereEquals('status', filters.status);
      }
    }

    if (filters.startDate && filters.endDate) {
      qb.whereBetween('created_at', filters.startDate, filters.endDate);
    }

    if (filters.search) {
      qb.whereLike('title', filters.search);
    }

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

  public async findPendingApprovalByApprover(approverId: string): Promise<Expense[]> {
    const sql = `
      SELECT e.*
      FROM expenses e
      JOIN approval_workflows aw ON aw.expense_id = e.id
      JOIN approval_steps ast ON ast.workflow_id = aw.id
      WHERE ast.approver_id = $1
        AND ast.status = 'PENDING'
        AND ast.step_order = aw.current_step_order
        AND aw.status = 'PENDING'
      ORDER BY e.created_at ASC
    `;
    const result = await this.db.query(sql, [approverId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findUserDailyExpenses(userId: string, date: Date | string): Promise<Expense[]> {
    const sql = `
      SELECT DISTINCT e.*
      FROM expenses e
      JOIN expense_items ei ON ei.expense_id = e.id
      WHERE e.user_id = $1
        AND ei.expense_date = $2
        AND e.status NOT IN ('CANCELLED', 'REJECTED')
    `;
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const result = await this.db.query(sql, [userId, dateStr]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async generateNextCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const countSql = `
      SELECT COUNT(*) AS total
      FROM expenses
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const res = await this.db.query(countSql, [currentYear]);
    const nextNum = parseInt(res.rows[0]?.total || '0', 10) + 1;
    const padded = String(nextNum).padStart(6, '0');
    return `EXP-${currentYear}-${padded}`;
  }

  public async save(entity: Expense): Promise<Expense> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, code, title, description, user_id, department_id, cost_center_id,
        status, currency, total_amount_cents, reimbursable_amount_cents,
        advance_payment_id, submitted_at, approved_at, paid_at,
        rejected_at, rejection_reason, revision_notes, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.code,
      row.title,
      row.description,
      row.user_id,
      row.department_id,
      row.cost_center_id,
      row.status,
      row.currency,
      row.total_amount_cents,
      row.reimbursable_amount_cents,
      row.advance_payment_id,
      row.submitted_at,
      row.approved_at,
      row.paid_at,
      row.rejected_at,
      row.rejection_reason,
      row.revision_notes,
      row.metadata,
      row.created_at,
      row.updated_at,
    ];

    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0], entity.items, entity.receipts);
  }

  public async update(entity: Expense): Promise<Expense> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        title = $2,
        description = $3,
        department_id = $4,
        cost_center_id = $5,
        status = $6,
        currency = $7,
        total_amount_cents = $8,
        reimbursable_amount_cents = $9,
        advance_payment_id = $10,
        submitted_at = $11,
        approved_at = $12,
        paid_at = $13,
        rejected_at = $14,
        rejection_reason = $15,
        revision_notes = $16,
        metadata = $17,
        updated_at = $18
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.title,
      row.description,
      row.department_id,
      row.cost_center_id,
      row.status,
      row.currency,
      row.total_amount_cents,
      row.reimbursable_amount_cents,
      row.advance_payment_id,
      row.submitted_at,
      row.approved_at,
      row.paid_at,
      row.rejected_at,
      row.rejection_reason,
      row.revision_notes,
      row.metadata,
      row.updated_at,
    ];

    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0], entity.items, entity.receipts);
  }
}

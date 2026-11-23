import { BasePostgresRepository } from './BasePostgresRepository';
import { IExpenseItemRepository } from './IExpenseItemRepository';
import { ExpenseItem } from '../../domain/entities/ExpenseItem';
import { Money } from '../../domain/value-objects';
import { Currency } from '../../domain/enums';

export class ExpenseItemRepository extends BasePostgresRepository<ExpenseItem> implements IExpenseItemRepository {
  protected readonly tableName = 'expense_items';

  protected mapToEntity(row: any): ExpenseItem {
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
  }

  protected mapToRow(entity: ExpenseItem): Record<string, any> {
    return {
      id: entity.id,
      expense_id: entity.expenseId,
      category_id: entity.categoryId,
      description: entity.description,
      amount_cents: entity.amount.amountInCents,
      currency: entity.amount.currency,
      expense_date: entity.expenseDate,
      merchant_name: entity.merchantName || null,
      merchant_tax_id: entity.merchantTaxId || null,
      invoice_number: entity.invoiceNumber || null,
      kilometers: entity.kilometers || null,
      participants_count: entity.participantsCount || 1,
      participants_names: entity.participantsNames || null,
      justification: entity.justification || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByExpenseId(expenseId: string): Promise<ExpenseItem[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE expense_id = $1 ORDER BY expense_date ASC, created_at ASC`;
    const result = await this.db.query(sql, [expenseId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByCategoryId(categoryId: string): Promise<ExpenseItem[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE category_id = $1 ORDER BY expense_date DESC`;
    const result = await this.db.query(sql, [categoryId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async deleteByExpenseId(expenseId: string): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE expense_id = $1`;
    const result = await this.db.query(sql, [expenseId]);
    return result.rowCount || 0;
  }

  public async save(entity: ExpenseItem): Promise<ExpenseItem> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, expense_id, category_id, description, amount_cents, currency,
        expense_date, merchant_name, merchant_tax_id, invoice_number,
        kilometers, participants_count, participants_names, justification,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.expense_id,
      row.category_id,
      row.description,
      row.amount_cents,
      row.currency,
      row.expense_date,
      row.merchant_name,
      row.merchant_tax_id,
      row.invoice_number,
      row.kilometers,
      row.participants_count,
      row.participants_names,
      row.justification,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: ExpenseItem): Promise<ExpenseItem> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        category_id = $2,
        description = $3,
        amount_cents = $4,
        currency = $5,
        expense_date = $6,
        merchant_name = $7,
        merchant_tax_id = $8,
        invoice_number = $9,
        kilometers = $10,
        participants_count = $11,
        participants_names = $12,
        justification = $13,
        updated_at = $14
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.category_id,
      row.description,
      row.amount_cents,
      row.currency,
      row.expense_date,
      row.merchant_name,
      row.merchant_tax_id,
      row.invoice_number,
      row.kilometers,
      row.participants_count,
      row.participants_names,
      row.justification,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

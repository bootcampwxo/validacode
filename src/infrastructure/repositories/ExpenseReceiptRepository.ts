import { BasePostgresRepository } from './BasePostgresRepository';
import { IExpenseReceiptRepository } from './IExpenseReceiptRepository';
import { ExpenseReceipt } from '../../domain/entities/ExpenseReceipt';

export class ExpenseReceiptRepository
  extends BasePostgresRepository<ExpenseReceipt>
  implements IExpenseReceiptRepository
{
  protected readonly tableName = 'expense_receipts';

  protected mapToEntity(row: any): ExpenseReceipt {
    return new ExpenseReceipt({
      id: row.id,
      expenseId: row.expense_id,
      expenseItemId: row.expense_item_id || undefined,
      originalFileName: row.original_file_name,
      storedFileName: row.stored_file_name,
      filePath: row.file_path,
      fileSize: parseInt(row.file_size, 10),
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
  }

  protected mapToRow(entity: ExpenseReceipt): Record<string, any> {
    return {
      id: entity.id,
      expense_id: entity.expenseId,
      expense_item_id: entity.expenseItemId || null,
      original_file_name: entity.originalFileName,
      stored_file_name: entity.storedFileName,
      file_path: entity.filePath,
      file_size: entity.fileSize,
      mime_type: entity.mimeType,
      file_hash: entity.fileHash,
      ocr_extracted_text: entity.ocrExtractedText || null,
      ocr_extracted_amount_cents: entity.ocrExtractedAmount
        ? Math.round(entity.ocrExtractedAmount * 100)
        : null,
      ocr_extracted_date: entity.ocrExtractedDate || null,
      ocr_extracted_cnpj: entity.ocrExtractedCnpj || null,
      is_verified: entity.isVerified,
      uploaded_by_id: entity.uploadedById,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findByExpenseId(expenseId: string): Promise<ExpenseReceipt[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE expense_id = $1 ORDER BY created_at ASC`;
    const result = await this.db.query(sql, [expenseId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByItemId(itemId: string): Promise<ExpenseReceipt[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE expense_item_id = $1 ORDER BY created_at ASC`;
    const result = await this.db.query(sql, [itemId]);
    return result.rows.map((r) => this.mapToEntity(r));
  }

  public async findByFileHash(fileHash: string): Promise<ExpenseReceipt | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE file_hash = $1 LIMIT 1`;
    const result = await this.db.query(sql, [fileHash]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async save(entity: ExpenseReceipt): Promise<ExpenseReceipt> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, expense_id, expense_item_id, original_file_name, stored_file_name,
        file_path, file_size, mime_type, file_hash, ocr_extracted_text,
        ocr_extracted_amount_cents, ocr_extracted_date, ocr_extracted_cnpj,
        is_verified, uploaded_by_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    const params = [
      row.id,
      row.expense_id,
      row.expense_item_id,
      row.original_file_name,
      row.stored_file_name,
      row.file_path,
      row.file_size,
      row.mime_type,
      row.file_hash,
      row.ocr_extracted_text,
      row.ocr_extracted_amount_cents,
      row.ocr_extracted_date,
      row.ocr_extracted_cnpj,
      row.is_verified,
      row.uploaded_by_id,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: ExpenseReceipt): Promise<ExpenseReceipt> {
    const row = this.mapToRow(entity);
    const sql = `
      UPDATE ${this.tableName} SET
        expense_item_id = $2,
        ocr_extracted_text = $3,
        ocr_extracted_amount_cents = $4,
        ocr_extracted_date = $5,
        ocr_extracted_cnpj = $6,
        is_verified = $7,
        updated_at = $8
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      row.id,
      row.expense_item_id,
      row.ocr_extracted_text,
      row.ocr_extracted_amount_cents,
      row.ocr_extracted_date,
      row.ocr_extracted_cnpj,
      row.is_verified,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }
}

import { BasePostgresRepository } from './BasePostgresRepository';
import { ICurrencyRateRepository } from './ICurrencyRateRepository';
import { CurrencyRate } from '../../domain/entities/CurrencyRate';
import { Currency } from '../../domain/enums';

export class CurrencyRateRepository
  extends BasePostgresRepository<CurrencyRate>
  implements ICurrencyRateRepository
{
  protected readonly tableName = 'currency_rates';

  protected mapToEntity(row: any): CurrencyRate {
    return new CurrencyRate({
      id: row.id,
      sourceCurrency: row.source_currency as Currency,
      targetCurrency: row.target_currency as Currency,
      rate: parseFloat(row.rate),
      effectiveDate: new Date(row.effective_date),
      source: row.source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  protected mapToRow(entity: CurrencyRate): Record<string, any> {
    return {
      id: entity.id,
      source_currency: entity.sourceCurrency,
      target_currency: entity.targetCurrency,
      rate: entity.rate,
      effective_date: entity.effectiveDate,
      source: entity.source || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  public async findLatestRate(source: Currency, target: Currency): Promise<CurrencyRate | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE source_currency = $1 AND target_currency = $2
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    const result = await this.db.query(sql, [source, target]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findRateOnDate(
    source: Currency,
    target: Currency,
    date: Date | string
  ): Promise<CurrencyRate | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE source_currency = $1 AND target_currency = $2 AND effective_date <= $3
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const result = await this.db.query(sql, [source, target, dateStr]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async save(entity: CurrencyRate): Promise<CurrencyRate> {
    const row = this.mapToRow(entity);
    const sql = `
      INSERT INTO ${this.tableName} (
        id, source_currency, target_currency, rate, effective_date, source, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (source_currency, target_currency, effective_date) DO UPDATE SET
        rate = EXCLUDED.rate,
        source = EXCLUDED.source,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const params = [
      row.id,
      row.source_currency,
      row.target_currency,
      row.rate,
      row.effective_date,
      row.source,
      row.created_at,
      row.updated_at,
    ];
    const result = await this.db.query(sql, params);
    return this.mapToEntity(result.rows[0]);
  }

  public async update(entity: CurrencyRate): Promise<CurrencyRate> {
    return this.save(entity);
  }
}

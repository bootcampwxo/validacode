import { CurrencyRate } from '../../domain/entities/CurrencyRate';
import { IBaseRepository } from './IBaseRepository';
import { Currency } from '../../domain/enums';

export interface ICurrencyRateRepository extends IBaseRepository<CurrencyRate> {
  findLatestRate(source: Currency, target: Currency): Promise<CurrencyRate | null>;
  findRateOnDate(source: Currency, target: Currency, date: Date | string): Promise<CurrencyRate | null>;
}

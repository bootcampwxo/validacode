import { BaseEntity } from './BaseEntity';
import { Currency } from '../enums';
import { ValidationError } from '../exceptions';

export interface CurrencyRateProps {
  id: string;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  rate: number;
  effectiveDate: Date;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CurrencyRate extends BaseEntity {
  private _sourceCurrency: Currency;
  private _targetCurrency: Currency;
  private _rate: number;
  private _effectiveDate: Date;
  private _source?: string;

  constructor(props: CurrencyRateProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (props.rate <= 0) {
      throw new ValidationError('A taxa de câmbio deve ser maior que zero');
    }
    this._sourceCurrency = props.sourceCurrency;
    this._targetCurrency = props.targetCurrency;
    this._rate = props.rate;
    this._effectiveDate = new Date(props.effectiveDate);
    this._source = props.source;
  }

  public get sourceCurrency(): Currency {
    return this._sourceCurrency;
  }

  public get targetCurrency(): Currency {
    return this._targetCurrency;
  }

  public get rate(): number {
    return this._rate;
  }

  public get effectiveDate(): Date {
    return new Date(this._effectiveDate.getTime());
  }

  public get source(): string | undefined {
    return this._source;
  }

  public convert(amount: number): number {
    return amount * this._rate;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      sourceCurrency: this._sourceCurrency,
      targetCurrency: this._targetCurrency,
      rate: this._rate,
      effectiveDate: this._effectiveDate,
      source: this._source,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

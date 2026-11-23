import { Currency } from '../enums';
import { ValidationError } from '../exceptions';

export class Money {
  private readonly _amountInCents: number;
  private readonly _currency: Currency;

  private constructor(amountInCents: number, currency: Currency = Currency.BRL) {
    if (!Number.isInteger(amountInCents)) {
      throw new ValidationError('Valor monetário interno deve ser um número inteiro de centavos');
    }
    this._amountInCents = amountInCents;
    this._currency = currency;
  }

  public static fromDecimal(amount: number, currency: Currency = Currency.BRL): Money {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('Valor decimal monetário inválido');
    }
    const cents = Math.round(amount * 100);
    return new Money(cents, currency);
  }

  public static fromCents(cents: number, currency: Currency = Currency.BRL): Money {
    return new Money(cents, currency);
  }

  public static zero(currency: Currency = Currency.BRL): Money {
    return new Money(0, currency);
  }

  public get amountInCents(): number {
    return this._amountInCents;
  }

  public get decimalValue(): number {
    return this._amountInCents / 100;
  }

  public get currency(): Currency {
    return this._currency;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amountInCents + other._amountInCents, this._currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this._amountInCents - other._amountInCents;
    return new Money(result, this._currency);
  }

  public multiply(factor: number): Money {
    const cents = Math.round(this._amountInCents * factor);
    return new Money(cents, this._currency);
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amountInCents > other._amountInCents;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amountInCents >= other._amountInCents;
  }

  public isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amountInCents < other._amountInCents;
  }

  public isZero(): boolean {
    return this._amountInCents === 0;
  }

  public isNegative(): boolean {
    return this._amountInCents < 0;
  }

  public isPositive(): boolean {
    return this._amountInCents > 0;
  }

  public equals(other: Money): boolean {
    return this._amountInCents === other._amountInCents && this._currency === other._currency;
  }

  public format(locale = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
    }).format(this.decimalValue);
  }

  public toJSON(): { amount: number; cents: number; currency: string; formatted: string } {
    return {
      amount: this.decimalValue,
      cents: this._amountInCents,
      currency: this._currency,
      formatted: this.format(),
    };
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new ValidationError(
        `Operação monetária inválida entre moedas distintas: ${this._currency} e ${other._currency}`
      );
    }
  }
}

import { Money } from '../../../src/domain/value-objects/Money';
import { Currency } from '../../../src/domain/enums';
import { ValidationError } from '../../../src/domain/exceptions';

describe('Money Value Object', () => {
  it('deve instanciar Money a partir de valor decimal com arredondamento preciso', () => {
    const m = Money.fromDecimal(150.75, Currency.BRL);
    expect(m.decimalValue).toBe(150.75);
    expect(m.amountInCents).toBe(15075);
    expect(m.currency).toBe(Currency.BRL);
  });

  it('deve somar dois valores monetários da mesma moeda', () => {
    const m1 = Money.fromDecimal(100.0, Currency.BRL);
    const m2 = Money.fromDecimal(50.25, Currency.BRL);
    const sum = m1.add(m2);

    expect(sum.decimalValue).toBe(150.25);
    expect(sum.amountInCents).toBe(15025);
  });

  it('deve subtrair dois valores monetários da mesma moeda', () => {
    const m1 = Money.fromDecimal(100.0, Currency.BRL);
    const m2 = Money.fromDecimal(40.0, Currency.BRL);
    const diff = m1.subtract(m2);

    expect(diff.decimalValue).toBe(60.0);
    expect(diff.amountInCents).toBe(6000);
  });

  it('deve multiplicar por um fator', () => {
    const m = Money.fromDecimal(20.0, Currency.BRL);
    const result = m.multiply(1.5);
    expect(result.decimalValue).toBe(30.0);
  });

  it('deve comparar grandezas monetárias corretamente', () => {
    const m1 = Money.fromDecimal(100.0, Currency.BRL);
    const m2 = Money.fromDecimal(50.0, Currency.BRL);
    const m3 = Money.fromDecimal(100.0, Currency.BRL);

    expect(m1.isGreaterThan(m2)).toBe(true);
    expect(m2.isLessThan(m1)).toBe(true);
    expect(m1.isGreaterThanOrEqual(m3)).toBe(true);
    expect(m1.equals(m3)).toBe(true);
  });

  it('deve lançar erro ao tentar somar moedas diferentes', () => {
    const brl = Money.fromDecimal(100, Currency.BRL);
    const usd = Money.fromDecimal(100, Currency.USD);

    expect(() => brl.add(usd)).toThrow(ValidationError);
  });
});

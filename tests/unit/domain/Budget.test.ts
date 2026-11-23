import { Budget } from '../../../src/domain/entities/Budget';
import { Money } from '../../../src/domain/value-objects/Money';
import { BusinessRuleViolationError } from '../../../src/domain/exceptions';

describe('Budget Entity', () => {
  it('deve calcular corretamente o saldo disponível e percentual consumido', () => {
    const budget = new Budget({
      id: 'bdg-1',
      costCenterId: 'cc-1',
      year: 2026,
      allocatedAmount: Money.fromDecimal(10000.0),
      consumedAmount: Money.fromDecimal(3000.0),
      reservedAmount: Money.fromDecimal(2000.0),
      alertThresholdPercentage: 80,
    });

    expect(budget.availableAmount.decimalValue).toBe(5000.0);
    expect(budget.consumptionPercentage).toBe(50.0);
    expect(budget.isThresholdExceeded()).toBe(false);
  });

  it('deve reservar saldo com sucesso e disparar alerta de teto quando atingido', () => {
    const budget = new Budget({
      id: 'bdg-1',
      costCenterId: 'cc-1',
      year: 2026,
      allocatedAmount: Money.fromDecimal(1000.0),
      alertThresholdPercentage: 80,
    });

    budget.reserve(Money.fromDecimal(850.0));

    expect(budget.availableAmount.decimalValue).toBe(150.0);
    expect(budget.isThresholdExceeded()).toBe(true);
  });

  it('deve lançar erro ao tentar reservar valor superior ao disponível', () => {
    const budget = new Budget({
      id: 'bdg-1',
      costCenterId: 'cc-1',
      year: 2026,
      allocatedAmount: Money.fromDecimal(500.0),
    });

    expect(() => budget.reserve(Money.fromDecimal(600.0))).toThrow(BusinessRuleViolationError);
  });
});

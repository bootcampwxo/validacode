import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class BudgetPolicy implements IPolicyChecker {
  public readonly name = 'BudgetPolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, budget } = context;

    if (budget) {
      if (!budget.canAccommodate(expense.totalAmount)) {
        violations.push({
          ruleCode: 'POL-BDG-001',
          ruleName: 'Estouro de Orçamento de Centro de Custo',
          violationType: PolicyViolationType.EXCEEDS_BUDGET,
          severity: PolicySeverity.BLOCKING,
          message: `A despesa de ${expense.totalAmount.format()} excede o saldo disponível de ${budget.availableAmount.format()} do centro de custo para o período.`,
          detectedValue: expense.totalAmount.decimalValue,
          allowedValue: budget.availableAmount.decimalValue,
        });
      } else if (budget.isThresholdExceeded()) {
        violations.push({
          ruleCode: 'POL-BDG-002',
          ruleName: 'Alerta de Consumo Elevado de Orçamento',
          violationType: PolicyViolationType.EXCEEDS_BUDGET,
          severity: PolicySeverity.INFO,
          message: `O centro de custo já consumiu ${budget.consumptionPercentage.toFixed(1)}% do orçamento alocado.`,
          detectedValue: budget.consumptionPercentage,
        });
      }
    }

    return violations;
  }
}

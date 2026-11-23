import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';
import { Money } from '../value-objects';

export class DailyAllowancePolicy implements IPolicyChecker {
  public readonly name = 'DailyAllowancePolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, categories } = context;

    // Agrupa gastos por categoria e por dia (formato YYYY-MM-DD)
    const dailyCategoryTotals = new Map<string, Money>();

    for (const item of expense.items) {
      const category = categories.get(item.categoryId);
      if (category && category.maxDailyLimit) {
        const dateKey = `${category.id}_${item.expenseDate.toISOString().split('T')[0]}`;
        const currentTotal = dailyCategoryTotals.get(dateKey) || Money.zero(item.amount.currency);
        dailyCategoryTotals.set(dateKey, currentTotal.add(item.amount));
      }
    }

    for (const [key, total] of dailyCategoryTotals.entries()) {
      const [categoryId, dateStr] = key.split('_');
      const category = categories.get(categoryId);
      if (category && category.maxDailyLimit && total.isGreaterThan(category.maxDailyLimit)) {
        violations.push({
          ruleCode: 'POL-DAY-001',
          ruleName: 'Teto Diário da Categoria Ultrapassado',
          violationType: PolicyViolationType.DAILY_LIMIT_EXCEEDED,
          severity: PolicySeverity.BLOCKING,
          message: `O total de despesas na data ${dateStr} para a categoria '${category.name}' somou ${total.format()}, superando o limite diário de ${category.maxDailyLimit.format()}.`,
          categoryCode: category.code,
          detectedValue: total.decimalValue,
          allowedValue: category.maxDailyLimit.decimalValue,
        });
      }
    }

    return violations;
  }
}

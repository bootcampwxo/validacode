import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class CategoryLimitPolicy implements IPolicyChecker {
  public readonly name = 'CategoryLimitPolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, categories } = context;

    for (const item of expense.items) {
      const category = categories.get(item.categoryId);
      if (category && category.maxLimitPerExpense) {
        if (item.amount.isGreaterThan(category.maxLimitPerExpense)) {
          violations.push({
            ruleCode: 'POL-CAT-001',
            ruleName: 'Limite por Item da Categoria Excedido',
            violationType: PolicyViolationType.CATEGORY_LIMIT_EXCEEDED,
            severity: PolicySeverity.BLOCKING,
            message: `O item '${item.description}' no valor de ${item.amount.format()} excede o limite máximo permitido de ${category.maxLimitPerExpense.format()} para a categoria '${category.name}'.`,
            itemId: item.id,
            categoryCode: category.code,
            detectedValue: item.amount.decimalValue,
            allowedValue: category.maxLimitPerExpense.decimalValue,
          });
        }
      }
    }

    return violations;
  }
}

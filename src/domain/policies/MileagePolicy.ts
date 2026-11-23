import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity, CategoryType } from '../enums';

export class MileagePolicy implements IPolicyChecker {
  public readonly name = 'MileagePolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, categories } = context;

    for (const item of expense.items) {
      const category = categories.get(item.categoryId);
      if (category && category.type === CategoryType.TRANSPORT_MILEAGE) {
        if (!item.kilometers || item.kilometers <= 0) {
          violations.push({
            ruleCode: 'POL-MIL-001',
            ruleName: 'Quilometragem Obrigatória',
            violationType: PolicyViolationType.MILEAGE_RATE_INVALID,
            severity: PolicySeverity.BLOCKING,
            message: `Despesas na categoria '${category.name}' exigem a informação exata da quantidade de quilômetros rodados.`,
            itemId: item.id,
            categoryCode: category.code,
          });
        }

        if (!item.justification || item.justification.trim().length < 5) {
          violations.push({
            ruleCode: 'POL-MIL-002',
            ruleName: 'Itinerário Obrigatório em Quilometragem',
            violationType: PolicyViolationType.MILEAGE_RATE_INVALID,
            severity: PolicySeverity.WARNING,
            message: `O item de quilometragem '${item.description}' deve conter o itinerário completo (Origem -> Destino) no campo de justificativa.`,
            itemId: item.id,
            categoryCode: category.code,
          });
        }
      }
    }

    return violations;
  }
}

import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class ExpenseAgePolicy implements IPolicyChecker {
  public readonly name = 'ExpenseAgePolicy';
  private readonly defaultMaxAgeDays: number;

  constructor(defaultMaxAgeDays = 60) {
    this.defaultMaxAgeDays = defaultMaxAgeDays;
  }

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, policyRules } = context;

    // Busca regra customizada de idade máxima ou usa o padrão
    const ageRule = policyRules.find((r) => r.violationType === PolicyViolationType.EXPENSE_TOO_OLD && r.isActive);
    const maxDays = ageRule?.maxAgeInDays || this.defaultMaxAgeDays;

    const now = new Date();

    for (const item of expense.items) {
      const itemDate = new Date(item.expenseDate);
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (ageDays > maxDays) {
        violations.push({
          ruleCode: 'POL-AGE-001',
          ruleName: 'Prazo Limite para Submissão Excedido',
          violationType: PolicyViolationType.EXPENSE_TOO_OLD,
          severity: PolicySeverity.WARNING,
          message: `O item '${item.description}' ocorreu há ${ageDays} dias, excedendo o prazo limite regulamentar de ${maxDays} dias. Requer justificativa especial da diretoria.`,
          itemId: item.id,
          detectedValue: ageDays,
          allowedValue: maxDays,
        });
      }
    }

    return violations;
  }
}

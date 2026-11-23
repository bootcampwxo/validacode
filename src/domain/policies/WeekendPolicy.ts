import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class WeekendPolicy implements IPolicyChecker {
  public readonly name = 'WeekendPolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense } = context;

    for (const item of expense.items) {
      const itemDate = new Date(item.expenseDate);
      const dayOfWeek = itemDate.getDay(); // 0 = Domingo, 6 = Sábado

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend) {
        if (!item.justification || item.justification.trim().length < 10) {
          violations.push({
            ruleCode: 'POL-WND-001',
            ruleName: 'Despesa em Fim de Semana sem Justificativa',
            violationType: PolicyViolationType.WEEKEND_WITHOUT_JUSTIFICATION,
            severity: PolicySeverity.WARNING,
            message: `O item '${item.description}' foi lançado em um fim de semana e necessita de justificativa detalhada das atividades corporativas exercidas.`,
            itemId: item.id,
            detectedValue: dayOfWeek === 0 ? 'Domingo' : 'Sábado',
          });
        }
      }
    }

    return violations;
  }
}

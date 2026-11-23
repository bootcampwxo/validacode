import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class AlcoholPolicy implements IPolicyChecker {
  public readonly name = 'AlcoholPolicy';
  private static readonly FORBIDDEN_KEYWORDS = [
    'cerveja', 'chope', 'chopp', 'vinho', 'whisky', 'whiskey', 'vodka',
    'gin', 'caipirinha', 'espumante', 'prosecco', 'licor', 'alcool', 'álcool'
  ];

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense } = context;

    for (const item of expense.items) {
      const textToScan = `${item.description} ${item.merchantName || ''}`.toLowerCase();
      
      const foundKeyword = AlcoholPolicy.FORBIDDEN_KEYWORDS.find((kw) =>
        new RegExp(`\\b${kw}\\b`, 'i').test(textToScan)
      );

      if (foundKeyword) {
        violations.push({
          ruleCode: 'POL-ALC-001',
          ruleName: 'Proibição de Despesas com Bebidas Alcoólicas',
          violationType: PolicyViolationType.ALCOHOL_NOT_PERMITTED,
          severity: PolicySeverity.BLOCKING,
          message: `O item '${item.description}' contém menção ao termo restrito '${foundKeyword}'. Bebidas alcoólicas não são elegíveis para reembolso corporativo.`,
          itemId: item.id,
          detectedValue: foundKeyword,
        });
      }
    }

    return violations;
  }
}

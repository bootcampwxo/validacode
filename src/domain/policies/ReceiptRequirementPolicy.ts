import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { PolicyViolationType, PolicySeverity } from '../enums';

export class ReceiptRequirementPolicy implements IPolicyChecker {
  public readonly name = 'ReceiptRequirementPolicy';

  public check(context: PolicyEvaluationContext): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const { expense, categories } = context;

    for (const item of expense.items) {
      const category = categories.get(item.categoryId);
      const requiresReceipt = category ? category.requiresReceipt : true;

      if (requiresReceipt) {
        const itemReceipts = expense.receipts.filter(
          (r) => r.expenseItemId === item.id || !r.expenseItemId
        );

        if (itemReceipts.length === 0) {
          violations.push({
            ruleCode: 'POL-REC-001',
            ruleName: 'Comprovante Obrigatório',
            violationType: PolicyViolationType.RECEIPT_MISSING,
            severity: PolicySeverity.BLOCKING,
            message: `O item '${item.description}' da categoria '${category?.name || 'Geral'}' exige comprovante fiscal obrigatório.`,
            itemId: item.id,
            categoryCode: category?.code,
          });
        }
      }
    }

    return violations;
  }
}

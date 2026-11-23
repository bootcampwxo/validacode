import { Expense, ExpenseCategory, Budget, PolicyRule } from '../entities';
import { PolicyViolationType, PolicySeverity } from '../enums';

export interface PolicyViolation {
  ruleCode: string;
  ruleName: string;
  violationType: PolicyViolationType;
  severity: PolicySeverity;
  message: string;
  itemId?: string;
  categoryCode?: string;
  detectedValue?: unknown;
  allowedValue?: unknown;
}

export interface PolicyEvaluationContext {
  expense: Expense;
  categories: Map<string, ExpenseCategory>;
  policyRules: PolicyRule[];
  budget?: Budget;
  historicalUserExpensesInSameDay?: Expense[];
}

export interface IPolicyChecker {
  name: string;
  check(context: PolicyEvaluationContext): Promise<PolicyViolation[]> | PolicyViolation[];
}

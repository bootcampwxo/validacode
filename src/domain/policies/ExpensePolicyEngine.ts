import { IPolicyChecker, PolicyEvaluationContext, PolicyViolation } from './IPolicyChecker';
import { ReceiptRequirementPolicy } from './ReceiptRequirementPolicy';
import { CategoryLimitPolicy } from './CategoryLimitPolicy';
import { DailyAllowancePolicy } from './DailyAllowancePolicy';
import { ExpenseAgePolicy } from './ExpenseAgePolicy';
import { WeekendPolicy } from './WeekendPolicy';
import { AlcoholPolicy } from './AlcoholPolicy';
import { MileagePolicy } from './MileagePolicy';
import { BudgetPolicy } from './BudgetPolicy';
import { PolicySeverity } from '../enums';

export interface PolicyEvaluationResult {
  isValid: boolean;
  hasBlockingViolations: boolean;
  hasWarnings: boolean;
  violations: PolicyViolation[];
  blockingViolations: PolicyViolation[];
  warnings: PolicyViolation[];
  infoNotes: PolicyViolation[];
  evaluatedAt: Date;
}

export class ExpensePolicyEngine {
  private readonly checkers: IPolicyChecker[] = [];

  constructor(customCheckers?: IPolicyChecker[], maxAgeDays?: number) {
    if (customCheckers && customCheckers.length > 0) {
      this.checkers = customCheckers;
    } else {
      this.checkers = [
        new ReceiptRequirementPolicy(),
        new CategoryLimitPolicy(),
        new DailyAllowancePolicy(),
        new ExpenseAgePolicy(maxAgeDays),
        new WeekendPolicy(),
        new AlcoholPolicy(),
        new MileagePolicy(),
        new BudgetPolicy(),
      ];
    }
  }

  public registerChecker(checker: IPolicyChecker): void {
    this.checkers.push(checker);
  }

  public async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const allViolations: PolicyViolation[] = [];

    for (const checker of this.checkers) {
      const result = await checker.check(context);
      if (Array.isArray(result)) {
        allViolations.push(...result);
      }
    }

    const blockingViolations = allViolations.filter((v) => v.severity === PolicySeverity.BLOCKING);
    const warnings = allViolations.filter((v) => v.severity === PolicySeverity.WARNING);
    const infoNotes = allViolations.filter((v) => v.severity === PolicySeverity.INFO);

    return {
      isValid: blockingViolations.length === 0,
      hasBlockingViolations: blockingViolations.length > 0,
      hasWarnings: warnings.length > 0,
      violations: allViolations,
      blockingViolations,
      warnings,
      infoNotes,
      evaluatedAt: new Date(),
    };
  }
}

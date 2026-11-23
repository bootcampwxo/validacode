import { PolicyRule } from '../../domain/entities/PolicyRule';
import { IBaseRepository } from './IBaseRepository';
import { CategoryType, PolicyViolationType } from '../../domain/enums';

export interface IPolicyRuleRepository extends IBaseRepository<PolicyRule> {
  findByCode(code: string): Promise<PolicyRule | null>;
  findActiveRules(): Promise<PolicyRule[]>;
  findByCategoryType(type: CategoryType): Promise<PolicyRule[]>;
  findByViolationType(violationType: PolicyViolationType): Promise<PolicyRule[]>;
}

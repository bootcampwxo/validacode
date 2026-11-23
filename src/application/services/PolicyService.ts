import { v4 as uuidv4 } from 'uuid';
import { IPolicyRuleRepository } from '../../infrastructure/repositories/IPolicyRuleRepository';
import { CreatePolicyRuleDto, UpdatePolicyRuleDto, PolicyRuleResponseDto } from '../dtos/policy.dto';
import { PolicyRule } from '../../domain/entities/PolicyRule';
import { Money } from '../../domain/value-objects';
import { ConflictError, NotFoundError } from '../../domain/exceptions';

export class PolicyService {
  constructor(private readonly policyRepository: IPolicyRuleRepository) {}

  public async createPolicyRule(dto: CreatePolicyRuleDto): Promise<PolicyRuleResponseDto> {
    const existing = await this.policyRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictError(`Regra de política com o código '${dto.code}' já existe`);
    }

    const rule = new PolicyRule({
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      description: dto.description,
      violationType: dto.violationType,
      severity: dto.severity,
      categoryType: dto.categoryType,
      categoryId: dto.categoryId,
      maxAmount: dto.maxAmount ? Money.fromDecimal(dto.maxAmount) : undefined,
      maxDailyAmount: dto.maxDailyAmount ? Money.fromDecimal(dto.maxDailyAmount) : undefined,
      maxAgeInDays: dto.maxAgeInDays,
      requiresReceipt: dto.requiresReceipt,
      requiresJustification: dto.requiresJustification,
      allowWeekend: dto.allowWeekend,
      allowAlcohol: dto.allowAlcohol,
      isActive: true,
    });

    const saved = await this.policyRepository.save(rule);
    return this.mapToResponse(saved);
  }

  public async listActiveRules(): Promise<PolicyRuleResponseDto[]> {
    const list = await this.policyRepository.findActiveRules();
    return list.map((r) => this.mapToResponse(r));
  }

  public async getRuleById(id: string): Promise<PolicyRuleResponseDto> {
    const rule = await this.policyRepository.findById(id);
    if (!rule) {
      throw new NotFoundError('Regra de Política', id);
    }
    return this.mapToResponse(rule);
  }

  public async updatePolicyRule(id: string, dto: UpdatePolicyRuleDto): Promise<PolicyRuleResponseDto> {
    const rule = await this.policyRepository.findById(id);
    if (!rule) {
      throw new NotFoundError('Regra de Política', id);
    }

    if (dto.isActive === true) rule.activate();
    if (dto.isActive === false) rule.deactivate();

    const updated = await this.policyRepository.update(rule);
    return this.mapToResponse(updated);
  }

  private mapToResponse(rule: PolicyRule): PolicyRuleResponseDto {
    return {
      id: rule.id,
      code: rule.code,
      name: rule.name,
      description: rule.description,
      violationType: rule.violationType,
      severity: rule.severity,
      categoryType: rule.categoryType,
      categoryId: rule.categoryId,
      maxAmount: rule.maxAmount ? rule.maxAmount.toJSON() : null,
      maxDailyAmount: rule.maxDailyAmount ? rule.maxDailyAmount.toJSON() : null,
      maxAgeInDays: rule.maxAgeInDays,
      requiresReceipt: rule.requiresReceipt,
      requiresJustification: rule.requiresJustification,
      allowWeekend: rule.allowWeekend,
      allowAlcohol: rule.allowAlcohol,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}

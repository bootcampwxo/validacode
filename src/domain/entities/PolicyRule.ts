import { BaseEntity } from './BaseEntity';
import { PolicyViolationType, PolicySeverity, CategoryType } from '../enums';
import { Money } from '../value-objects';
import { ValidationError } from '../exceptions';

export interface PolicyRuleProps {
  id: string;
  code: string;
  name: string;
  description?: string;
  violationType: PolicyViolationType;
  severity: PolicySeverity;
  categoryType?: CategoryType;
  categoryId?: string;
  maxAmount?: Money;
  maxDailyAmount?: Money;
  maxAgeInDays?: number;
  requiresReceipt?: boolean;
  requiresJustification?: boolean;
  allowWeekend?: boolean;
  allowAlcohol?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PolicyRule extends BaseEntity {
  private _code: string;
  private _name: string;
  private _description?: string;
  private _violationType: PolicyViolationType;
  private _severity: PolicySeverity;
  private _categoryType?: CategoryType;
  private _categoryId?: string;
  private _maxAmount?: Money;
  private _maxDailyAmount?: Money;
  private _maxAgeInDays?: number;
  private _requiresReceipt?: boolean;
  private _requiresJustification?: boolean;
  private _allowWeekend?: boolean;
  private _allowAlcohol?: boolean;
  private _isActive: boolean;

  constructor(props: PolicyRuleProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.code || props.code.trim().length === 0) {
      throw new ValidationError('Código da política corporativa é obrigatório');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Nome da política corporativa é obrigatório');
    }

    this._code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._description = props.description;
    this._violationType = props.violationType;
    this._severity = props.severity || PolicySeverity.WARNING;
    this._categoryType = props.categoryType;
    this._categoryId = props.categoryId;
    this._maxAmount = props.maxAmount;
    this._maxDailyAmount = props.maxDailyAmount;
    this._maxAgeInDays = props.maxAgeInDays;
    this._requiresReceipt = props.requiresReceipt;
    this._requiresJustification = props.requiresJustification;
    this._allowWeekend = props.allowWeekend;
    this._allowAlcohol = props.allowAlcohol;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get violationType(): PolicyViolationType {
    return this._violationType;
  }

  public get severity(): PolicySeverity {
    return this._severity;
  }

  public get categoryType(): CategoryType | undefined {
    return this._categoryType;
  }

  public get categoryId(): string | undefined {
    return this._categoryId;
  }

  public get maxAmount(): Money | undefined {
    return this._maxAmount;
  }

  public get maxDailyAmount(): Money | undefined {
    return this._maxDailyAmount;
  }

  public get maxAgeInDays(): number | undefined {
    return this._maxAgeInDays;
  }

  public get requiresReceipt(): boolean | undefined {
    return this._requiresReceipt;
  }

  public get requiresJustification(): boolean | undefined {
    return this._requiresJustification;
  }

  public get allowWeekend(): boolean | undefined {
    return this._allowWeekend;
  }

  public get allowAlcohol(): boolean | undefined {
    return this._allowAlcohol;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      name: this._name,
      description: this._description,
      violationType: this._violationType,
      severity: this._severity,
      categoryType: this._categoryType,
      categoryId: this._categoryId,
      maxAmount: this._maxAmount ? this._maxAmount.toJSON() : null,
      maxDailyAmount: this._maxDailyAmount ? this._maxDailyAmount.toJSON() : null,
      maxAgeInDays: this._maxAgeInDays,
      requiresReceipt: this._requiresReceipt,
      requiresJustification: this._requiresJustification,
      allowWeekend: this._allowWeekend,
      allowAlcohol: this._allowAlcohol,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

import { BaseEntity } from './BaseEntity';
import { CategoryType } from '../enums';
import { Money } from '../value-objects';
import { ValidationError } from '../exceptions';

export interface ExpenseCategoryProps {
  id: string;
  code: string;
  name: string;
  type: CategoryType;
  description?: string;
  maxLimitPerExpense?: Money;
  maxDailyLimit?: Money;
  requiresReceipt: boolean;
  requiresItemization: boolean;
  requiresJustification: boolean;
  mileageRatePerKm?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpenseCategory extends BaseEntity {
  private _code: string;
  private _name: string;
  private _type: CategoryType;
  private _description?: string;
  private _maxLimitPerExpense?: Money;
  private _maxDailyLimit?: Money;
  private _requiresReceipt: boolean;
  private _requiresItemization: boolean;
  private _requiresJustification: boolean;
  private _mileageRatePerKm?: number;
  private _isActive: boolean;

  constructor(props: ExpenseCategoryProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.code || props.code.trim().length === 0) {
      throw new ValidationError('Código da categoria de despesa é obrigatório');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Nome da categoria de despesa é obrigatório');
    }

    this._code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._type = props.type;
    this._description = props.description;
    this._maxLimitPerExpense = props.maxLimitPerExpense;
    this._maxDailyLimit = props.maxDailyLimit;
    this._requiresReceipt = props.requiresReceipt;
    this._requiresItemization = props.requiresItemization;
    this._requiresJustification = props.requiresJustification;
    this._mileageRatePerKm = props.mileageRatePerKm;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): CategoryType {
    return this._type;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get maxLimitPerExpense(): Money | undefined {
    return this._maxLimitPerExpense;
  }

  public get maxDailyLimit(): Money | undefined {
    return this._maxDailyLimit;
  }

  public get requiresReceipt(): boolean {
    return this._requiresReceipt;
  }

  public get requiresItemization(): boolean {
    return this._requiresItemization;
  }

  public get requiresJustification(): boolean {
    return this._requiresJustification;
  }

  public get mileageRatePerKm(): number | undefined {
    return this._mileageRatePerKm;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public isMileage(): boolean {
    return this._type === CategoryType.TRANSPORT_MILEAGE;
  }

  public calculateMileageAmount(kilometers: number): Money {
    if (!this.isMileage() || !this._mileageRatePerKm) {
      throw new ValidationError('Esta categoria não possui cálculo por quilometragem configurado');
    }
    const total = kilometers * this._mileageRatePerKm;
    return Money.fromDecimal(total);
  }

  public update(props: Partial<Omit<ExpenseCategoryProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) throw new ValidationError('Nome não pode ser vazio');
      this._name = props.name.trim();
    }
    if (props.description !== undefined) this._description = props.description;
    if (props.maxLimitPerExpense !== undefined) this._maxLimitPerExpense = props.maxLimitPerExpense;
    if (props.maxDailyLimit !== undefined) this._maxDailyLimit = props.maxDailyLimit;
    if (props.requiresReceipt !== undefined) this._requiresReceipt = props.requiresReceipt;
    if (props.requiresItemization !== undefined) this._requiresItemization = props.requiresItemization;
    if (props.requiresJustification !== undefined) this._requiresJustification = props.requiresJustification;
    if (props.mileageRatePerKm !== undefined) this._mileageRatePerKm = props.mileageRatePerKm;
    if (props.isActive !== undefined) this._isActive = props.isActive;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      name: this._name,
      type: this._type,
      description: this._description,
      maxLimitPerExpense: this._maxLimitPerExpense ? this._maxLimitPerExpense.toJSON() : null,
      maxDailyLimit: this._maxDailyLimit ? this._maxDailyLimit.toJSON() : null,
      requiresReceipt: this._requiresReceipt,
      requiresItemization: this._requiresItemization,
      requiresJustification: this._requiresJustification,
      mileageRatePerKm: this._mileageRatePerKm,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

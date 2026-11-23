import { BaseEntity } from './BaseEntity';
import { Money } from '../value-objects';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface BudgetProps {
  id: string;
  costCenterId: string;
  year: number;
  month?: number;
  allocatedAmount: Money;
  consumedAmount?: Money;
  reservedAmount?: Money;
  alertThresholdPercentage?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Budget extends BaseEntity {
  private _costCenterId: string;
  private _year: number;
  private _month?: number;
  private _allocatedAmount: Money;
  private _consumedAmount: Money;
  private _reservedAmount: Money;
  private _alertThresholdPercentage: number;
  private _isActive: boolean;

  constructor(props: BudgetProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.costCenterId) {
      throw new ValidationError('Centro de custo é obrigatório para o orçamento');
    }
    if (props.year < 2020 || props.year > 2050) {
      throw new ValidationError('Ano do orçamento inválido');
    }
    if (props.month !== undefined && (props.month < 1 || props.month > 12)) {
      throw new ValidationError('Mês do orçamento deve estar entre 1 e 12');
    }

    this._costCenterId = props.costCenterId;
    this._year = props.year;
    this._month = props.month;
    this._allocatedAmount = props.allocatedAmount;
    this._consumedAmount = props.consumedAmount || Money.zero(props.allocatedAmount.currency);
    this._reservedAmount = props.reservedAmount || Money.zero(props.allocatedAmount.currency);
    this._alertThresholdPercentage = props.alertThresholdPercentage || 80;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
  }

  public get costCenterId(): string {
    return this._costCenterId;
  }

  public get year(): number {
    return this._year;
  }

  public get month(): number | undefined {
    return this._month;
  }

  public get allocatedAmount(): Money {
    return this._allocatedAmount;
  }

  public get consumedAmount(): Money {
    return this._consumedAmount;
  }

  public get reservedAmount(): Money {
    return this._reservedAmount;
  }

  public get availableAmount(): Money {
    const totalCommitted = this._consumedAmount.add(this._reservedAmount);
    return this._allocatedAmount.subtract(totalCommitted);
  }

  public get consumptionPercentage(): number {
    if (this._allocatedAmount.isZero()) return 0;
    const totalCommitted = this._consumedAmount.add(this._reservedAmount);
    return (totalCommitted.amountInCents / this._allocatedAmount.amountInCents) * 100;
  }

  public isThresholdExceeded(): boolean {
    return this.consumptionPercentage >= this._alertThresholdPercentage;
  }

  public canAccommodate(amount: Money): boolean {
    return this.availableAmount.isGreaterThanOrEqual(amount);
  }

  public reserve(amount: Money): void {
    if (!this.canAccommodate(amount)) {
      throw new BusinessRuleViolationError(
        `Orçamento insuficiente no centro de custo. Disponível: ${this.availableAmount.format()}, Solicitado: ${amount.format()}`
      );
    }
    this._reservedAmount = this._reservedAmount.add(amount);
    this.touch();
  }

  public releaseReservation(amount: Money): void {
    this._reservedAmount = this._reservedAmount.subtract(amount);
    if (this._reservedAmount.isNegative()) {
      this._reservedAmount = Money.zero(this._allocatedAmount.currency);
    }
    this.touch();
  }

  public consumeReserved(amount: Money): void {
    this.releaseReservation(amount);
    this._consumedAmount = this._consumedAmount.add(amount);
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      costCenterId: this._costCenterId,
      year: this._year,
      month: this._month,
      allocatedAmount: this._allocatedAmount.toJSON(),
      consumedAmount: this._consumedAmount.toJSON(),
      reservedAmount: this._reservedAmount.toJSON(),
      availableAmount: this.availableAmount.toJSON(),
      consumptionPercentage: parseFloat(this.consumptionPercentage.toFixed(2)),
      isThresholdExceeded: this.isThresholdExceeded(),
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

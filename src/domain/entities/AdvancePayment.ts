import { BaseEntity } from './BaseEntity';
import { AdvanceStatus, Currency } from '../enums';
import { Money } from '../value-objects';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface AdvancePaymentProps {
  id: string;
  code: string;
  userId: string;
  departmentId: string;
  costCenterId: string;
  purpose: string;
  requestedAmount: Money;
  approvedAmount?: Money;
  currency?: Currency;
  status?: AdvanceStatus;
  requestDate?: Date;
  expectedReconciliationDate: Date;
  actualReconciliationDate?: Date;
  approvedById?: string;
  approvedAt?: Date;
  disbursedAt?: Date;
  rejectionReason?: string;
  reconciledExpenseId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AdvancePayment extends BaseEntity {
  private _code: string;
  private _userId: string;
  private _departmentId: string;
  private _costCenterId: string;
  private _purpose: string;
  private _requestedAmount: Money;
  private _approvedAmount?: Money;
  private _currency: Currency;
  private _status: AdvanceStatus;
  private _requestDate: Date;
  private _expectedReconciliationDate: Date;
  private _actualReconciliationDate?: Date;
  private _approvedById?: string;
  private _approvedAt?: Date;
  private _disbursedAt?: Date;
  private _rejectionReason?: string;
  private _reconciledExpenseId?: string;

  constructor(props: AdvancePaymentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.purpose || props.purpose.trim().length < 5) {
      throw new ValidationError('A justificativa do adiantamento deve ter no mínimo 5 caracteres');
    }
    if (props.requestedAmount.isNegative() || props.requestedAmount.isZero()) {
      throw new ValidationError('O valor solicitado do adiantamento deve ser positivo');
    }

    this._code = props.code;
    this._userId = props.userId;
    this._departmentId = props.departmentId;
    this._costCenterId = props.costCenterId;
    this._purpose = props.purpose.trim();
    this._requestedAmount = props.requestedAmount;
    this._approvedAmount = props.approvedAmount;
    this._currency = props.currency || Currency.BRL;
    this._status = props.status || AdvanceStatus.PENDING;
    this._requestDate = props.requestDate || new Date();
    this._expectedReconciliationDate = new Date(props.expectedReconciliationDate);
    this._actualReconciliationDate = props.actualReconciliationDate
      ? new Date(props.actualReconciliationDate)
      : undefined;
    this._approvedById = props.approvedById;
    this._approvedAt = props.approvedAt;
    this._disbursedAt = props.disbursedAt;
    this._rejectionReason = props.rejectionReason;
    this._reconciledExpenseId = props.reconciledExpenseId;
  }

  public get code(): string {
    return this._code;
  }

  public get userId(): string {
    return this._userId;
  }

  public get departmentId(): string {
    return this._departmentId;
  }

  public get costCenterId(): string {
    return this._costCenterId;
  }

  public get purpose(): string {
    return this._purpose;
  }

  public get requestedAmount(): Money {
    return this._requestedAmount;
  }

  public get approvedAmount(): Money | undefined {
    return this._approvedAmount;
  }

  public get currency(): Currency {
    return this._currency;
  }

  public get status(): AdvanceStatus {
    return this._status;
  }

  public get requestDate(): Date {
    return new Date(this._requestDate.getTime());
  }

  public get expectedReconciliationDate(): Date {
    return new Date(this._expectedReconciliationDate.getTime());
  }

  public get actualReconciliationDate(): Date | undefined {
    return this._actualReconciliationDate;
  }

  public get approvedById(): string | undefined {
    return this._approvedById;
  }

  public get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  public get disbursedAt(): Date | undefined {
    return this._disbursedAt;
  }

  public get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  public get reconciledExpenseId(): string | undefined {
    return this._reconciledExpenseId;
  }

  public approve(approverId: string, approvedAmount?: Money): void {
    if (this._status !== AdvanceStatus.PENDING) {
      throw new BusinessRuleViolationError('Apenas solicitações pendentes podem ser aprovadas');
    }
    this._status = AdvanceStatus.APPROVED;
    this._approvedById = approverId;
    this._approvedAt = new Date();
    this._approvedAmount = approvedAmount || this._requestedAmount;
    this.touch();
  }

  public reject(reason: string): void {
    if (this._status !== AdvanceStatus.PENDING) {
      throw new BusinessRuleViolationError('Apenas solicitações pendentes podem ser rejeitadas');
    }
    this._status = AdvanceStatus.REJECTED;
    this._rejectionReason = reason;
    this.touch();
  }

  public markDisbursed(): void {
    if (this._status !== AdvanceStatus.APPROVED) {
      throw new BusinessRuleViolationError('Apenas adiantamentos aprovados podem ser pagos');
    }
    this._status = AdvanceStatus.DISBURSED;
    this._disbursedAt = new Date();
    this.touch();
  }

  public reconcile(expenseId: string): void {
    if (this._status !== AdvanceStatus.DISBURSED && this._status !== AdvanceStatus.OVERDUE) {
      throw new BusinessRuleViolationError('Apenas adiantamentos liberados podem ser prestados conta');
    }
    this._status = AdvanceStatus.RECONCILED;
    this._reconciledExpenseId = expenseId;
    this._actualReconciliationDate = new Date();
    this.touch();
  }

  public checkOverdue(): void {
    if (this._status === AdvanceStatus.DISBURSED && new Date() > this._expectedReconciliationDate) {
      this._status = AdvanceStatus.OVERDUE;
      this.touch();
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      userId: this._userId,
      departmentId: this._departmentId,
      costCenterId: this._costCenterId,
      purpose: this._purpose,
      requestedAmount: this._requestedAmount.toJSON(),
      approvedAmount: this._approvedAmount ? this._approvedAmount.toJSON() : null,
      currency: this._currency,
      status: this._status,
      requestDate: this._requestDate,
      expectedReconciliationDate: this._expectedReconciliationDate,
      actualReconciliationDate: this._actualReconciliationDate,
      approvedById: this._approvedById,
      approvedAt: this._approvedAt,
      disbursedAt: this._disbursedAt,
      rejectionReason: this._rejectionReason,
      reconciledExpenseId: this._reconciledExpenseId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

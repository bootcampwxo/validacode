import { BaseEntity } from './BaseEntity';
import { PaymentStatus, PaymentMethod } from '../enums';
import { Money } from '../value-objects';
import { ReimbursementPayment } from './ReimbursementPayment';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface ReimbursementBatchProps {
  id: string;
  batchCode: string;
  description?: string;
  status?: PaymentStatus;
  totalAmount?: Money;
  totalExpensesCount?: number;
  scheduledDate?: Date;
  processedAt?: Date;
  processedById?: string;
  payments?: ReimbursementPayment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReimbursementBatch extends BaseEntity {
  private _batchCode: string;
  private _description?: string;
  private _status: PaymentStatus;
  private _totalAmount: Money;
  private _totalExpensesCount: number;
  private _scheduledDate?: Date;
  private _processedAt?: Date;
  private _processedById?: string;
  private _payments: ReimbursementPayment[];

  constructor(props: ReimbursementBatchProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.batchCode || props.batchCode.trim().length === 0) {
      throw new ValidationError('Código do lote de reembolso é obrigatório');
    }

    this._batchCode = props.batchCode.trim().toUpperCase();
    this._description = props.description;
    this._status = props.status || PaymentStatus.PENDING;
    this._payments = props.payments || [];
    this._totalExpensesCount = props.totalExpensesCount || this._payments.length;
    this._scheduledDate = props.scheduledDate ? new Date(props.scheduledDate) : undefined;
    this._processedAt = props.processedAt ? new Date(props.processedAt) : undefined;
    this._processedById = props.processedById;

    if (props.totalAmount) {
      this._totalAmount = props.totalAmount;
    } else {
      this._totalAmount = this.calculateTotalFromPayments();
    }
  }

  public get batchCode(): string {
    return this._batchCode;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get status(): PaymentStatus {
    return this._status;
  }

  public get totalAmount(): Money {
    return this._totalAmount;
  }

  public get totalExpensesCount(): number {
    return this._totalExpensesCount;
  }

  public get scheduledDate(): Date | undefined {
    return this._scheduledDate;
  }

  public get processedAt(): Date | undefined {
    return this._processedAt;
  }

  public get processedById(): string | undefined {
    return this._processedById;
  }

  public get payments(): ReimbursementPayment[] {
    return [...this._payments];
  }

  public calculateTotalFromPayments(): Money {
    if (this._payments.length === 0) return Money.zero();
    return this._payments.reduce((sum, p) => sum.add(p.amount), Money.zero());
  }

  public addPayment(payment: ReimbursementPayment): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new BusinessRuleViolationError('Não é possível adicionar pagamentos a um lote que já não está pendente');
    }
    this._payments.push(payment);
    this._totalExpensesCount = this._payments.length;
    this._totalAmount = this.calculateTotalFromPayments();
    this.touch();
  }

  public schedule(scheduledDate: Date): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new BusinessRuleViolationError('Apenas lotes pendentes podem ser agendados');
    }
    this._status = PaymentStatus.SCHEDULED;
    this._scheduledDate = scheduledDate;
    this.touch();
  }

  public markProcessing(): void {
    this._status = PaymentStatus.PROCESSING;
    this.touch();
  }

  public complete(processedById: string): void {
    this._status = PaymentStatus.COMPLETED;
    this._processedAt = new Date();
    this._processedById = processedById;
    this.touch();
  }

  public fail(): void {
    this._status = PaymentStatus.FAILED;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      batchCode: this._batchCode,
      description: this._description,
      status: this._status,
      totalAmount: this._totalAmount.toJSON(),
      totalExpensesCount: this._totalExpensesCount,
      scheduledDate: this._scheduledDate,
      processedAt: this._processedAt,
      processedById: this._processedById,
      payments: this._payments.map((p) => p.toJSON()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

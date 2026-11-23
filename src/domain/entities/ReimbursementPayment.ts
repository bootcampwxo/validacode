import { BaseEntity } from './BaseEntity';
import { PaymentStatus, PaymentMethod } from '../enums';
import { Money, BankDetails } from '../value-objects';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface ReimbursementPaymentProps {
  id: string;
  batchId?: string;
  expenseId: string;
  recipientId: string;
  amount: Money;
  paymentMethod: PaymentMethod;
  bankDetailsSnapshot?: BankDetails;
  status?: PaymentStatus;
  transactionReference?: string;
  receiptNumber?: string;
  failureReason?: string;
  executedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReimbursementPayment extends BaseEntity {
  private _batchId?: string;
  private _expenseId: string;
  private _recipientId: string;
  private _amount: Money;
  private _paymentMethod: PaymentMethod;
  private _bankDetailsSnapshot?: BankDetails;
  private _status: PaymentStatus;
  private _transactionReference?: string;
  private _receiptNumber?: string;
  private _failureReason?: string;
  private _executedAt?: Date;

  constructor(props: ReimbursementPaymentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.expenseId) {
      throw new ValidationError('ID da despesa é obrigatório para o pagamento');
    }
    if (!props.recipientId) {
      throw new ValidationError('ID do favorecido é obrigatório para o pagamento');
    }
    if (props.amount.isNegative() || props.amount.isZero()) {
      throw new ValidationError('Valor do pagamento deve ser positivo');
    }

    this._batchId = props.batchId;
    this._expenseId = props.expenseId;
    this._recipientId = props.recipientId;
    this._amount = props.amount;
    this._paymentMethod = props.paymentMethod;
    this._bankDetailsSnapshot = props.bankDetailsSnapshot;
    this._status = props.status || PaymentStatus.PENDING;
    this._transactionReference = props.transactionReference;
    this._receiptNumber = props.receiptNumber;
    this._failureReason = props.failureReason;
    this._executedAt = props.executedAt;
  }

  public get batchId(): string | undefined {
    return this._batchId;
  }

  public get expenseId(): string {
    return this._expenseId;
  }

  public get recipientId(): string {
    return this._recipientId;
  }

  public get amount(): Money {
    return this._amount;
  }

  public get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  public get bankDetailsSnapshot(): BankDetails | undefined {
    return this._bankDetailsSnapshot;
  }

  public get status(): PaymentStatus {
    return this._status;
  }

  public get transactionReference(): string | undefined {
    return this._transactionReference;
  }

  public get receiptNumber(): string | undefined {
    return this._receiptNumber;
  }

  public get failureReason(): string | undefined {
    return this._failureReason;
  }

  public get executedAt(): Date | undefined {
    return this._executedAt;
  }

  public assignToBatch(batchId: string): void {
    this._batchId = batchId;
    this.touch();
  }

  public complete(transactionReference: string, receiptNumber?: string): void {
    if (this._status === PaymentStatus.COMPLETED) {
      throw new BusinessRuleViolationError('Pagamento já foi concluído anteriormente');
    }
    this._status = PaymentStatus.COMPLETED;
    this._transactionReference = transactionReference;
    this._receiptNumber = receiptNumber;
    this._executedAt = new Date();
    this.touch();
  }

  public fail(reason: string): void {
    this._status = PaymentStatus.FAILED;
    this._failureReason = reason;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      batchId: this._batchId,
      expenseId: this._expenseId,
      recipientId: this._recipientId,
      amount: this._amount.toJSON(),
      paymentMethod: this._paymentMethod,
      bankDetailsSnapshot: this._bankDetailsSnapshot ? this._bankDetailsSnapshot.toJSON() : null,
      status: this._status,
      transactionReference: this._transactionReference,
      receiptNumber: this._receiptNumber,
      failureReason: this._failureReason,
      executedAt: this._executedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

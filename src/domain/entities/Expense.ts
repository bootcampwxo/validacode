import { BaseEntity } from './BaseEntity';
import { ExpenseStatus, Currency } from '../enums';
import { Money } from '../value-objects';
import { ExpenseItem } from './ExpenseItem';
import { ExpenseReceipt } from './ExpenseReceipt';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface ExpenseProps {
  id: string;
  code: string;
  title: string;
  description?: string;
  userId: string;
  departmentId: string;
  costCenterId: string;
  status?: ExpenseStatus;
  currency?: Currency;
  totalAmount?: Money;
  advancePaymentId?: string;
  reimbursableAmount?: Money;
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  revisionNotes?: string;
  items?: ExpenseItem[];
  receipts?: ExpenseReceipt[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Expense extends BaseEntity {
  private _code: string;
  private _title: string;
  private _description?: string;
  private _userId: string;
  private _departmentId: string;
  private _costCenterId: string;
  private _status: ExpenseStatus;
  private _currency: Currency;
  private _totalAmount: Money;
  private _advancePaymentId?: string;
  private _reimbursableAmount: Money;
  private _submittedAt?: Date;
  private _approvedAt?: Date;
  private _paidAt?: Date;
  private _rejectedAt?: Date;
  private _rejectionReason?: string;
  private _revisionNotes?: string;
  private _items: ExpenseItem[];
  private _receipts: ExpenseReceipt[];
  private _metadata: Record<string, unknown>;

  constructor(props: ExpenseProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.title || props.title.trim().length < 3) {
      throw new ValidationError('Título do relatório de despesa deve ter no mínimo 3 caracteres');
    }
    if (!props.userId) {
      throw new ValidationError('Identificador do solicitante é obrigatório');
    }
    if (!props.departmentId) {
      throw new ValidationError('Departamento é obrigatório');
    }
    if (!props.costCenterId) {
      throw new ValidationError('Centro de custo é obrigatório');
    }

    this._code = props.code;
    this._title = props.title.trim();
    this._description = props.description;
    this._userId = props.userId;
    this._departmentId = props.departmentId;
    this._costCenterId = props.costCenterId;
    this._status = props.status || ExpenseStatus.DRAFT;
    this._currency = props.currency || Currency.BRL;
    this._advancePaymentId = props.advancePaymentId;
    this._items = props.items || [];
    this._receipts = props.receipts || [];
    this._metadata = props.metadata || {};
    this._rejectionReason = props.rejectionReason;
    this._revisionNotes = props.revisionNotes;
    this._submittedAt = props.submittedAt;
    this._approvedAt = props.approvedAt;
    this._paidAt = props.paidAt;
    this._rejectedAt = props.rejectedAt;

    if (props.totalAmount) {
      this._totalAmount = props.totalAmount;
    } else {
      this._totalAmount = this.calculateTotalFromItems();
    }

    if (props.reimbursableAmount) {
      this._reimbursableAmount = props.reimbursableAmount;
    } else {
      this._reimbursableAmount = this._totalAmount;
    }
  }

  public get code(): string {
    return this._code;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | undefined {
    return this._description;
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

  public get status(): ExpenseStatus {
    return this._status;
  }

  public get currency(): Currency {
    return this._currency;
  }

  public get totalAmount(): Money {
    return this._totalAmount;
  }

  public get advancePaymentId(): string | undefined {
    return this._advancePaymentId;
  }

  public get reimbursableAmount(): Money {
    return this._reimbursableAmount;
  }

  public get submittedAt(): Date | undefined {
    return this._submittedAt;
  }

  public get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  public get paidAt(): Date | undefined {
    return this._paidAt;
  }

  public get rejectedAt(): Date | undefined {
    return this._rejectedAt;
  }

  public get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  public get revisionNotes(): string | undefined {
    return this._revisionNotes;
  }

  public get items(): ExpenseItem[] {
    return [...this._items];
  }

  public get receipts(): ExpenseReceipt[] {
    return [...this._receipts];
  }

  public get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  public calculateTotalFromItems(): Money {
    if (this._items.length === 0) {
      return Money.zero(this._currency);
    }
    return this._items.reduce(
      (sum, item) => sum.add(item.amount),
      Money.zero(this._currency)
    );
  }

  public recalculateTotals(): void {
    this._totalAmount = this.calculateTotalFromItems();
    this._reimbursableAmount = this._totalAmount;
    this.touch();
  }

  public addItem(item: ExpenseItem): void {
    this.assertEditable();
    this._items.push(item);
    this.recalculateTotals();
  }

  public removeItem(itemId: string): void {
    this.assertEditable();
    const index = this._items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new ValidationError(`Item de despesa '${itemId}' não encontrado no relatório`);
    }
    this._items.splice(index, 1);
    this.recalculateTotals();
  }

  public addReceipt(receipt: ExpenseReceipt): void {
    this.assertEditable();
    this._receipts.push(receipt);
    this.touch();
  }

  public removeReceipt(receiptId: string): void {
    this.assertEditable();
    const index = this._receipts.findIndex((r) => r.id === receiptId);
    if (index === -1) {
      throw new ValidationError(`Comprovante '${receiptId}' não encontrado no relatório`);
    }
    this._receipts.splice(index, 1);
    this.touch();
  }

  public submit(): void {
    if (this._status !== ExpenseStatus.DRAFT && this._status !== ExpenseStatus.REQUIRES_REVISION) {
      throw new BusinessRuleViolationError(
        `Despesa no status '${this._status}' não pode ser submetida para aprovação`
      );
    }
    if (this._items.length === 0) {
      throw new BusinessRuleViolationError('Não é possível submeter um relatório de despesa sem itens');
    }
    if (this._totalAmount.isZero() || this._totalAmount.isNegative()) {
      throw new BusinessRuleViolationError('O valor total da despesa deve ser maior que zero');
    }

    this._status = ExpenseStatus.SUBMITTED;
    this._submittedAt = new Date();
    this._rejectionReason = undefined;
    this.touch();
  }

  public updateStatus(newStatus: ExpenseStatus): void {
    this._status = newStatus;
    this.touch();
  }

  public markApprovedByManager(): void {
    this._status = ExpenseStatus.APPROVED_BY_MANAGER;
    this.touch();
  }

  public markApprovedByDirector(): void {
    this._status = ExpenseStatus.APPROVED_BY_DIRECTOR;
    this.touch();
  }

  public markApprovedByVp(): void {
    this._status = ExpenseStatus.APPROVED_BY_VP;
    this.touch();
  }

  public markApprovedForPayment(): void {
    this._status = ExpenseStatus.APPROVED_FOR_PAYMENT;
    this._approvedAt = new Date();
    this.touch();
  }

  public markPaymentScheduled(): void {
    this._status = ExpenseStatus.PAYMENT_SCHEDULED;
    this.touch();
  }

  public markAsPaid(): void {
    if (this._status !== ExpenseStatus.APPROVED_FOR_PAYMENT && this._status !== ExpenseStatus.PAYMENT_SCHEDULED) {
      throw new BusinessRuleViolationError('Apenas despesas aprovadas para pagamento podem ser marcadas como pagas');
    }
    this._status = ExpenseStatus.PAID;
    this._paidAt = new Date();
    this.touch();
  }

  public reject(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Motivo da rejeição é obrigatório');
    }
    this._status = ExpenseStatus.REJECTED;
    this._rejectedAt = new Date();
    this._rejectionReason = reason.trim();
    this.touch();
  }

  public requestRevision(notes: string): void {
    if (!notes || notes.trim().length === 0) {
      throw new ValidationError('Instruções de revisão são obrigatórias');
    }
    this._status = ExpenseStatus.REQUIRES_REVISION;
    this._revisionNotes = notes.trim();
    this.touch();
  }

  public cancel(): void {
    if (this._status === ExpenseStatus.PAID) {
      throw new BusinessRuleViolationError('Despesas já pagas não podem ser canceladas');
    }
    this._status = ExpenseStatus.CANCELLED;
    this.touch();
  }

  public isEditable(): boolean {
    return this._status === ExpenseStatus.DRAFT || this._status === ExpenseStatus.REQUIRES_REVISION;
  }

  private assertEditable(): void {
    if (!this.isEditable()) {
      throw new BusinessRuleViolationError(
        `Despesa no status '${this._status}' não pode ser alterada. Apenas nos status Rascunho ou Revisão Solicitada.`
      );
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      title: this._title,
      description: this._description,
      userId: this._userId,
      departmentId: this._departmentId,
      costCenterId: this._costCenterId,
      status: this._status,
      currency: this._currency,
      totalAmount: this._totalAmount.toJSON(),
      advancePaymentId: this._advancePaymentId,
      reimbursableAmount: this._reimbursableAmount.toJSON(),
      submittedAt: this._submittedAt,
      approvedAt: this._approvedAt,
      paidAt: this._paidAt,
      rejectedAt: this._rejectedAt,
      rejectionReason: this._rejectionReason,
      revisionNotes: this._revisionNotes,
      items: this._items.map((i) => i.toJSON()),
      receipts: this._receipts.map((r) => r.toJSON()),
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

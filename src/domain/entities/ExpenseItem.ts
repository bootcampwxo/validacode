import { BaseEntity } from './BaseEntity';
import { Money } from '../value-objects';
import { ValidationError } from '../exceptions';

export interface ExpenseItemProps {
  id: string;
  expenseId: string;
  categoryId: string;
  description: string;
  amount: Money;
  expenseDate: Date;
  merchantName?: string;
  merchantTaxId?: string;
  invoiceNumber?: string;
  kilometers?: number;
  participantsCount?: number;
  participantsNames?: string[];
  justification?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpenseItem extends BaseEntity {
  private _expenseId: string;
  private _categoryId: string;
  private _description: string;
  private _amount: Money;
  private _expenseDate: Date;
  private _merchantName?: string;
  private _merchantTaxId?: string;
  private _invoiceNumber?: string;
  private _kilometers?: number;
  private _participantsCount?: number;
  private _participantsNames?: string[];
  private _justification?: string;

  constructor(props: ExpenseItemProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.description || props.description.trim().length === 0) {
      throw new ValidationError('Descrição do item de despesa é obrigatória');
    }
    if (props.amount.isNegative() || props.amount.isZero()) {
      throw new ValidationError('O valor do item de despesa deve ser maior que zero');
    }

    this._expenseId = props.expenseId;
    this._categoryId = props.categoryId;
    this._description = props.description.trim();
    this._amount = props.amount;
    this._expenseDate = new Date(props.expenseDate);
    this._merchantName = props.merchantName;
    this._merchantTaxId = props.merchantTaxId;
    this._invoiceNumber = props.invoiceNumber;
    this._kilometers = props.kilometers;
    this._participantsCount = props.participantsCount || 1;
    this._participantsNames = props.participantsNames;
    this._justification = props.justification;
  }

  public get expenseId(): string {
    return this._expenseId;
  }

  public get categoryId(): string {
    return this._categoryId;
  }

  public get description(): string {
    return this._description;
  }

  public get amount(): Money {
    return this._amount;
  }

  public get expenseDate(): Date {
    return new Date(this._expenseDate.getTime());
  }

  public get merchantName(): string | undefined {
    return this._merchantName;
  }

  public get merchantTaxId(): string | undefined {
    return this._merchantTaxId;
  }

  public get invoiceNumber(): string | undefined {
    return this._invoiceNumber;
  }

  public get kilometers(): number | undefined {
    return this._kilometers;
  }

  public get participantsCount(): number | undefined {
    return this._participantsCount;
  }

  public get participantsNames(): string[] | undefined {
    return this._participantsNames;
  }

  public get justification(): string | undefined {
    return this._justification;
  }

  public update(props: Partial<Omit<ExpenseItemProps, 'id' | 'expenseId' | 'createdAt' | 'updatedAt'>>): void {
    if (props.description !== undefined) {
      if (!props.description.trim()) throw new ValidationError('Descrição não pode ser vazia');
      this._description = props.description.trim();
    }
    if (props.amount !== undefined) {
      if (props.amount.isNegative() || props.amount.isZero()) {
        throw new ValidationError('Valor deve ser positivo');
      }
      this._amount = props.amount;
    }
    if (props.expenseDate !== undefined) this._expenseDate = new Date(props.expenseDate);
    if (props.categoryId !== undefined) this._categoryId = props.categoryId;
    if (props.merchantName !== undefined) this._merchantName = props.merchantName;
    if (props.merchantTaxId !== undefined) this._merchantTaxId = props.merchantTaxId;
    if (props.invoiceNumber !== undefined) this._invoiceNumber = props.invoiceNumber;
    if (props.kilometers !== undefined) this._kilometers = props.kilometers;
    if (props.participantsCount !== undefined) this._participantsCount = props.participantsCount;
    if (props.participantsNames !== undefined) this._participantsNames = props.participantsNames;
    if (props.justification !== undefined) this._justification = props.justification;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      expenseId: this._expenseId,
      categoryId: this._categoryId,
      description: this._description,
      amount: this._amount.toJSON(),
      expenseDate: this._expenseDate,
      merchantName: this._merchantName,
      merchantTaxId: this._merchantTaxId,
      invoiceNumber: this._invoiceNumber,
      kilometers: this._kilometers,
      participantsCount: this._participantsCount,
      participantsNames: this._participantsNames,
      justification: this._justification,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

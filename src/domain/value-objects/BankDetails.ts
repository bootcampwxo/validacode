import { PaymentMethod } from '../enums';
import { ValidationError } from '../exceptions';

export interface BankAccountProps {
  bankCode: string;
  bankName: string;
  agencyNumber: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  pixKey?: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  preferredPaymentMethod: PaymentMethod;
}

export class BankDetails {
  private readonly _bankCode: string;
  private readonly _bankName: string;
  private readonly _agencyNumber: string;
  private readonly _accountNumber: string;
  private readonly _accountType: 'CHECKING' | 'SAVINGS';
  private readonly _pixKey?: string;
  private readonly _pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  private readonly _preferredPaymentMethod: PaymentMethod;

  constructor(props: BankAccountProps) {
    if (!props.bankCode || props.bankCode.trim().length === 0) {
      throw new ValidationError('Código do banco é obrigatório');
    }
    if (!props.agencyNumber || props.agencyNumber.trim().length === 0) {
      throw new ValidationError('Número da agência bancária é obrigatório');
    }
    if (!props.accountNumber || props.accountNumber.trim().length === 0) {
      throw new ValidationError('Número da conta bancária é obrigatório');
    }

    this._bankCode = props.bankCode.trim();
    this._bankName = props.bankName?.trim() || 'Banco';
    this._agencyNumber = props.agencyNumber.trim();
    this._accountNumber = props.accountNumber.trim();
    this._accountType = props.accountType || 'CHECKING';
    this._pixKey = props.pixKey?.trim();
    this._pixKeyType = props.pixKeyType;
    this._preferredPaymentMethod = props.preferredPaymentMethod || PaymentMethod.PIX;
  }

  public get bankCode(): string {
    return this._bankCode;
  }

  public get bankName(): string {
    return this._bankName;
  }

  public get agencyNumber(): string {
    return this._agencyNumber;
  }

  public get accountNumber(): string {
    return this._accountNumber;
  }

  public get accountType(): 'CHECKING' | 'SAVINGS' {
    return this._accountType;
  }

  public get pixKey(): string | undefined {
    return this._pixKey;
  }

  public get pixKeyType(): string | undefined {
    return this._pixKeyType;
  }

  public get preferredPaymentMethod(): PaymentMethod {
    return this._preferredPaymentMethod;
  }

  public toJSON(): Record<string, unknown> {
    return {
      bankCode: this._bankCode,
      bankName: this._bankName,
      agencyNumber: this._agencyNumber,
      accountNumber: this._accountNumber,
      accountType: this._accountType,
      pixKey: this._pixKey,
      pixKeyType: this._pixKeyType,
      preferredPaymentMethod: this._preferredPaymentMethod,
    };
  }
}

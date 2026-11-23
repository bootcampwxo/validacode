import { ValidationError } from '../exceptions';

export class Email {
  private readonly _value: string;
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Endereço de email não pode ser vazio');
    }
    const normalized = value.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new ValidationError(`Endereço de email inválido: '${value}'`);
    }
    this._value = normalized;
  }

  public get value(): string {
    return this._value;
  }

  public get domain(): string {
    return this._value.split('@')[1];
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

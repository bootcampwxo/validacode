import { ValidationError } from '../exceptions';

export class CPF {
  private readonly _value: string;

  constructor(value: string) {
    const clean = value ? value.replace(/\D/g, '') : '';
    if (!CPF.isValid(clean)) {
      throw new ValidationError(`CPF inválido: '${value}'`);
    }
    this._value = clean;
  }

  public static isValid(cpf: string): boolean {
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10), 10)) return false;

    return true;
  }

  public get raw(): string {
    return this._value;
  }

  public get formatted(): string {
    return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  public equals(other: CPF): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this.formatted;
  }
}

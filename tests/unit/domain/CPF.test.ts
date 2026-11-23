import { CPF } from '../../../src/domain/value-objects/CPF';
import { ValidationError } from '../../../src/domain/exceptions';

describe('CPF Value Object', () => {
  it('deve validar e formatar um CPF válido com dígitos verificadores', () => {
    // CPF de teste válido
    const validCpf = '11144477735';
    const cpf = new CPF(validCpf);

    expect(cpf.raw).toBe('11144477735');
    expect(cpf.formatted).toBe('111.444.777-35');
  });

  it('deve lançar ValidationError para CPF com dígitos repetidos inválidos', () => {
    expect(() => new CPF('11111111111')).toThrow(ValidationError);
    expect(() => new CPF('22222222222')).toThrow(ValidationError);
  });

  it('deve lançar ValidationError para CPF com tamanho ou checksum incorreto', () => {
    expect(() => new CPF('12345678900')).toThrow(ValidationError);
    expect(() => new CPF('123')).toThrow(ValidationError);
  });
});

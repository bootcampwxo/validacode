import { Email } from '../../../src/domain/value-objects/Email';
import { ValidationError } from '../../../src/domain/exceptions';

describe('Email Value Object', () => {
  it('deve normalizar e aceitar email válido', () => {
    const email = new Email('  Colaborador.Silva@Empresa.COM.br  ');
    expect(email.value).toBe('colaborador.silva@empresa.com.br');
    expect(email.domain).toBe('empresa.com.br');
  });

  it('deve lançar ValidationError para formatos de email inválidos', () => {
    expect(() => new Email('')).toThrow(ValidationError);
    expect(() => new Email('invalido-sem-arroba.com')).toThrow(ValidationError);
    expect(() => new Email('usuario@')).toThrow(ValidationError);
  });
});

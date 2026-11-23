/**
 * Hierarquia de Exceções e Erros de Domínio
 */

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly timestamp: string;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  constructor(message = 'Dados de requisição inválidos', details?: unknown) {
    super(message, details);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  constructor(message = 'Não autenticado ou token inválido', details?: unknown) {
    super(message, details);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  constructor(message = 'Acesso não permitido para esta operação', details?: unknown) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  constructor(resource = 'Recurso', id?: string | number) {
    const message = id ? `${resource} com identificador '${id}' não foi encontrado` : `${resource} não encontrado`;
    super(message);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  constructor(message = 'Conflito com o estado atual do recurso', details?: unknown) {
    super(message, details);
  }
}

export class BusinessRuleViolationError extends AppError {
  public readonly statusCode = 422;
  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class PolicyViolationError extends AppError {
  public readonly statusCode = 422;
  public readonly violations: Array<{ rule: string; message: string; severity: string }>;

  constructor(
    message: string,
    violations: Array<{ rule: string; message: string; severity: string }> = []
  ) {
    super(message, { violations });
    this.violations = violations;
  }
}

export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  constructor(message = 'Erro interno ao processar operação no banco de dados', details?: unknown) {
    super(message, details);
  }
}

export class ExternalServiceError extends AppError {
  public readonly statusCode = 502;
  constructor(service: string, message = 'Falha de comunicação com serviço externo', details?: unknown) {
    super(`[${service}] ${message}`, details);
  }
}

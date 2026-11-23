import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../../../domain/exceptions';
import { UserRole, CategoryType, PaymentMethod, PolicyViolationType, PolicySeverity, Currency } from '../../../domain/enums';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ValidationError('Dados da requisição inválidos', issues));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ValidationError('Parâmetros de consulta inválidos', issues));
    }
    req.query = result.data as any;
    next();
  };
}

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
});

export const bankDetailsSchema = z.object({
  bankCode: z.string().min(1, 'Código do banco é obrigatório'),
  bankName: z.string().min(1, 'Nome do banco é obrigatório'),
  agencyNumber: z.string().min(1, 'Número da agência é obrigatório'),
  accountNumber: z.string().min(1, 'Número da conta é obrigatório'),
  accountType: z.enum(['CHECKING', 'SAVINGS']),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']).optional(),
  preferredPaymentMethod: z.nativeEnum(PaymentMethod),
});

export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  bankDetails: bankDetailsSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  bankDetails: bankDetailsSchema.optional(),
});

export const createExpenseItemSchema = z.object({
  categoryId: z.string().uuid('ID de categoria inválido'),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  amount: z.number().positive('O valor deve ser positivo'),
  currency: z.nativeEnum(Currency).optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  merchantName: z.string().optional(),
  merchantTaxId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  kilometers: z.number().positive().optional(),
  participantsCount: z.number().int().positive().optional(),
  participantsNames: z.array(z.string()).optional(),
  justification: z.string().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  currency: z.nativeEnum(Currency).optional(),
  advancePaymentId: z.string().uuid().optional(),
  items: z.array(createExpenseItemSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const approveExpenseSchema = z.object({
  comments: z.string().optional(),
});

export const rejectExpenseSchema = z.object({
  reason: z.string().min(3, 'Motivo da rejeição é obrigatório'),
});

export const requestRevisionSchema = z.object({
  instructions: z.string().min(3, 'Instruções de revisão são obrigatórias'),
});

export const createReimbursementBatchSchema = z.object({
  description: z.string().optional(),
  expenseIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos uma despesa para o lote'),
  scheduledDate: z.string().optional(),
});

export const processBatchPaymentSchema = z.object({
  transactionReferencePrefix: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  code: z.string().min(2, 'Código do departamento é obrigatório'),
  name: z.string().min(3, 'Nome do departamento é obrigatório'),
  managerId: z.string().uuid().optional(),
  directorId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
});

export const createCostCenterSchema = z.object({
  code: z.string().min(2, 'Código do centro de custo é obrigatório'),
  name: z.string().min(3, 'Nome do centro de custo é obrigatório'),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
});

export const createBudgetSchema = z.object({
  costCenterId: z.string().uuid('ID do centro de custo é obrigatório'),
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12).optional(),
  allocatedAmount: z.number().positive('Valor do orçamento deve ser positivo'),
  currency: z.nativeEnum(Currency).optional(),
  alertThresholdPercentage: z.number().int().min(1).max(100).optional(),
});

export const createPolicyRuleSchema = z.object({
  code: z.string().min(2, 'Código da política é obrigatório'),
  name: z.string().min(3, 'Nome da política é obrigatório'),
  description: z.string().optional(),
  violationType: z.nativeEnum(PolicyViolationType),
  severity: z.nativeEnum(PolicySeverity),
  categoryType: z.nativeEnum(CategoryType).optional(),
  categoryId: z.string().uuid().optional(),
  maxAmount: z.number().positive().optional(),
  maxDailyAmount: z.number().positive().optional(),
  maxAgeInDays: z.number().int().positive().optional(),
  requiresReceipt: z.boolean().optional(),
  requiresJustification: z.boolean().optional(),
  allowWeekend: z.boolean().optional(),
  allowAlcohol: z.boolean().optional(),
});

export const createAdvancePaymentSchema = z.object({
  departmentId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  purpose: z.string().min(5, 'Justificativa do adiantamento é obrigatória'),
  requestedAmount: z.number().positive('Valor do adiantamento deve ser positivo'),
  currency: z.nativeEnum(Currency).optional(),
  expectedReconciliationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data esperada deve estar no formato YYYY-MM-DD'),
});

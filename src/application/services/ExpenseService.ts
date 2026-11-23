import { v4 as uuidv4 } from 'uuid';
import { IExpenseRepository, ExpenseFilterParams } from '../../infrastructure/repositories/IExpenseRepository';
import { IExpenseItemRepository } from '../../infrastructure/repositories/IExpenseItemRepository';
import { IExpenseReceiptRepository } from '../../infrastructure/repositories/IExpenseReceiptRepository';
import { IExpenseCategoryRepository } from '../../infrastructure/repositories/IExpenseCategoryRepository';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { IBudgetRepository } from '../../infrastructure/repositories/IBudgetRepository';
import { IPolicyRuleRepository } from '../../infrastructure/repositories/IPolicyRuleRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../infrastructure/notifications/IEmailSender';
import { EmailTemplates } from '../../infrastructure/notifications/EmailTemplates';
import { ExpensePolicyEngine } from '../../domain/policies/ExpensePolicyEngine';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateExpenseItemDto,
  ExpenseResponseDto,
  SubmitExpenseResponseDto,
} from '../dtos/expense.dto';
import { Expense } from '../../domain/entities/Expense';
import { ExpenseItem } from '../../domain/entities/ExpenseItem';
import { ExpenseReceipt } from '../../domain/entities/ExpenseReceipt';
import { Notification } from '../../domain/entities/Notification';
import { AuditLog } from '../../domain/entities/AuditLog';
import { ExpenseStatus, AuditAction, NotificationType, Currency, PolicySeverity } from '../../domain/enums';
import { Money } from '../../domain/value-objects';
import { NotFoundError, ForbiddenError, BusinessRuleViolationError, PolicyViolationError } from '../../domain/exceptions';
import { PaginatedResult } from '../../infrastructure/database/QueryBuilder';
import { ApprovalWorkflowService } from './ApprovalWorkflowService';

export class ExpenseService {
  private readonly policyEngine: ExpensePolicyEngine;

  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly itemRepository: IExpenseItemRepository,
    private readonly receiptRepository: IExpenseReceiptRepository,
    private readonly categoryRepository: IExpenseCategoryRepository,
    private readonly userRepository: IUserRepository,
    private readonly budgetRepository: IBudgetRepository,
    private readonly policyRuleRepository: IPolicyRuleRepository,
    private readonly auditRepository: IAuditLogRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly emailSender: IEmailSender,
    private readonly workflowService: ApprovalWorkflowService
  ) {
    this.policyEngine = new ExpensePolicyEngine();
  }

  public async createExpense(
    userId: string,
    dto: CreateExpenseDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ExpenseResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário solicitante', userId);
    }

    const departmentId = dto.departmentId || user.departmentId;
    if (!departmentId) {
      throw new BusinessRuleViolationError('Departamento não informado e usuário não possui departamento padrão');
    }

    const nextCode = await this.expenseRepository.generateNextCode();
    const expenseId = uuidv4();
    const currency = dto.currency || Currency.BRL;

    const items: ExpenseItem[] = [];
    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        const item = new ExpenseItem({
          id: uuidv4(),
          expenseId,
          categoryId: itemDto.categoryId,
          description: itemDto.description,
          amount: Money.fromDecimal(itemDto.amount, itemDto.currency || currency),
          expenseDate: new Date(itemDto.expenseDate),
          merchantName: itemDto.merchantName,
          merchantTaxId: itemDto.merchantTaxId,
          invoiceNumber: itemDto.invoiceNumber,
          kilometers: itemDto.kilometers,
          participantsCount: itemDto.participantsCount,
          participantsNames: itemDto.participantsNames,
          justification: itemDto.justification,
        });
        items.push(item);
      }
    }

    const expense = new Expense({
      id: expenseId,
      code: nextCode,
      title: dto.title,
      description: dto.description,
      userId,
      departmentId,
      costCenterId: dto.costCenterId || '11111111-1111-1111-1111-111111111101',
      status: ExpenseStatus.DRAFT,
      currency,
      advancePaymentId: dto.advancePaymentId,
      items,
      metadata: dto.metadata,
    });

    const saved = await this.expenseRepository.save(expense);

    for (const item of items) {
      await this.itemRepository.save(item);
    }

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId,
        userEmail: user.email.value,
        action: AuditAction.EXPENSE_CREATE,
        entityName: 'Expense',
        entityId: saved.id,
        newValues: saved.toJSON(),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(saved);
  }

  public async getExpenseById(id: string, requestingUserId?: string, userRole?: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findWithDetails(id);
    if (!expense) {
      throw new NotFoundError('Relatório de Despesa', id);
    }

    if (
      requestingUserId &&
      userRole !== 'ADMIN' &&
      userRole !== 'AUDITOR' &&
      userRole !== 'FINANCIAL_MANAGER' &&
      userRole !== 'FINANCIAL_ANALYST' &&
      expense.userId !== requestingUserId
    ) {
      // Verifica se é o gestor do solicitante
      const requester = await this.userRepository.findById(expense.userId);
      if (requester?.managerId !== requestingUserId) {
        throw new ForbiddenError('Você não tem permissão para visualizar esta despesa');
      }
    }

    return this.mapToResponse(expense);
  }

  public async addItemToExpense(
    expenseId: string,
    dto: CreateExpenseItemDto,
    userId: string
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (!expense) {
      throw new NotFoundError('Relatório de Despesa', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('Apenas o autor pode adicionar itens ao relatório de despesa');
    }

    const item = new ExpenseItem({
      id: uuidv4(),
      expenseId,
      categoryId: dto.categoryId,
      description: dto.description,
      amount: Money.fromDecimal(dto.amount, dto.currency || expense.currency),
      expenseDate: new Date(dto.expenseDate),
      merchantName: dto.merchantName,
      merchantTaxId: dto.merchantTaxId,
      invoiceNumber: dto.invoiceNumber,
      kilometers: dto.kilometers,
      participantsCount: dto.participantsCount,
      participantsNames: dto.participantsNames,
      justification: dto.justification,
    });

    expense.addItem(item);
    await this.itemRepository.save(item);
    await this.expenseRepository.update(expense);

    return this.mapToResponse(expense);
  }

  public async removeItemFromExpense(expenseId: string, itemId: string, userId: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (!expense) {
      throw new NotFoundError('Relatório de Despesa', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('Apenas o autor pode remover itens da despesa');
    }

    expense.removeItem(itemId);
    await this.itemRepository.delete(itemId);
    await this.expenseRepository.update(expense);

    return this.mapToResponse(expense);
  }

  public async submitExpense(
    expenseId: string,
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<SubmitExpenseResponseDto> {
    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (!expense) {
      throw new NotFoundError('Relatório de Despesa', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('Apenas o autor pode submeter o relatório de despesa');
    }

    // Carrega dados de contexto para validação de políticas corporativas
    const activeCategories = await this.categoryRepository.findActiveCategories();
    const categoriesMap = new Map(activeCategories.map((c) => [c.id, c]));
    const policyRules = await this.policyRuleRepository.findActiveRules();
    const currentYear = new Date().getFullYear();
    const budget = await this.budgetRepository.findByCostCenterAndPeriod(
      expense.costCenterId,
      currentYear
    );

    const evaluation = await this.policyEngine.evaluate({
      expense,
      categories: categoriesMap,
      policyRules,
      budget: budget || undefined,
    });

    if (evaluation.hasBlockingViolations) {
      throw new PolicyViolationError(
        'A despesa não pode ser submetida devido a violações impeditivas de políticas corporativas',
        evaluation.blockingViolations
      );
    }

    expense.submit();
    await this.expenseRepository.update(expense);

    // Inicia fluxo de aprovação multinível
    await this.workflowService.startWorkflow(expense);

    const user = await this.userRepository.findById(userId);

    // Registra Auditoria
    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId,
        userEmail: user?.email.value,
        action: AuditAction.EXPENSE_SUBMIT,
        entityName: 'Expense',
        entityId: expense.id,
        metadata: { violationsCount: evaluation.violations.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    // Envia Notificação Interna e Email
    const notif = new Notification({
      id: uuidv4(),
      userId,
      type: NotificationType.EXPENSE_SUBMITTED,
      title: 'Despesa Submetida',
      message: `Sua despesa ${expense.code} no valor de ${expense.totalAmount.format()} foi enviada para aprovação.`,
      data: { expenseId: expense.id, code: expense.code },
    });
    await this.notificationRepository.save(notif);

    if (user) {
      const emailContent = EmailTemplates.expenseSubmitted({
        userName: user.name,
        expenseCode: expense.code,
        expenseTitle: expense.title,
        totalAmount: expense.totalAmount.format(),
      });
      await this.emailSender.sendEmail({
        to: user.email.value,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    }

    return {
      expense: this.mapToResponse(expense),
      policyValidation: {
        isValid: evaluation.isValid,
        hasBlockingViolations: evaluation.hasBlockingViolations,
        hasWarnings: evaluation.hasWarnings,
        violations: evaluation.violations,
      },
    };
  }

  public async searchExpenses(filters: ExpenseFilterParams): Promise<PaginatedResult<ExpenseResponseDto>> {
    const result = await this.expenseRepository.searchExpenses(filters);
    return {
      data: result.data.map((e) => this.mapToResponse(e)),
      pagination: result.pagination,
    };
  }

  public async cancelExpense(expenseId: string, userId: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (!expense) {
      throw new NotFoundError('Relatório de Despesa', expenseId);
    }
    if (expense.userId !== userId) {
      throw new ForbiddenError('Apenas o solicitante pode cancelar sua própria despesa');
    }

    expense.cancel();
    await this.expenseRepository.update(expense);
    return this.mapToResponse(expense);
  }

  public mapToResponse(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      code: expense.code,
      title: expense.title,
      description: expense.description,
      userId: expense.userId,
      departmentId: expense.departmentId,
      costCenterId: expense.costCenterId,
      status: expense.status,
      currency: expense.currency,
      totalAmount: expense.totalAmount.toJSON(),
      reimbursableAmount: expense.reimbursableAmount.toJSON(),
      advancePaymentId: expense.advancePaymentId,
      submittedAt: expense.submittedAt,
      approvedAt: expense.approvedAt,
      paidAt: expense.paidAt,
      rejectedAt: expense.rejectedAt,
      rejectionReason: expense.rejectionReason,
      revisionNotes: expense.revisionNotes,
      items: expense.items.map((i) => ({
        id: i.id,
        expenseId: i.expenseId,
        categoryId: i.categoryId,
        description: i.description,
        amount: i.amount.toJSON(),
        expenseDate: i.expenseDate.toISOString().split('T')[0],
        merchantName: i.merchantName,
        merchantTaxId: i.merchantTaxId,
        invoiceNumber: i.invoiceNumber,
        kilometers: i.kilometers,
        participantsCount: i.participantsCount,
        participantsNames: i.participantsNames,
        justification: i.justification,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
      receipts: expense.receipts.map((r) => ({
        id: r.id,
        expenseId: r.expenseId,
        expenseItemId: r.expenseItemId,
        originalFileName: r.originalFileName,
        storedFileName: r.storedFileName,
        filePath: r.filePath,
        fileSize: r.fileSize,
        mimeType: r.mimeType,
        ocrExtractedText: r.ocrExtractedText,
        ocrExtractedAmount: r.ocrExtractedAmount,
        ocrExtractedDate: r.ocrExtractedDate,
        ocrExtractedCnpj: r.ocrExtractedCnpj,
        isVerified: r.isVerified,
        uploadedById: r.uploadedById,
        createdAt: r.createdAt,
      })),
      metadata: expense.metadata,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}

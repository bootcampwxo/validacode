import { v4 as uuidv4 } from 'uuid';
import { IReimbursementBatchRepository } from '../../infrastructure/repositories/IReimbursementBatchRepository';
import { IReimbursementPaymentRepository } from '../../infrastructure/repositories/IReimbursementPaymentRepository';
import { IExpenseRepository } from '../../infrastructure/repositories/IExpenseRepository';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../infrastructure/notifications/IEmailSender';
import { EmailTemplates } from '../../infrastructure/notifications/EmailTemplates';
import {
  CreateReimbursementBatchDto,
  ProcessBatchPaymentDto,
  ReimbursementBatchResponseDto,
} from '../dtos/reimbursement.dto';
import { ReimbursementBatch } from '../../domain/entities/ReimbursementBatch';
import { ReimbursementPayment } from '../../domain/entities/ReimbursementPayment';
import { Notification } from '../../domain/entities/Notification';
import { AuditLog } from '../../domain/entities/AuditLog';
import {
  ExpenseStatus,
  PaymentStatus,
  PaymentMethod,
  AuditAction,
  NotificationType,
} from '../../domain/enums';
import { Money } from '../../domain/value-objects';
import { NotFoundError, BusinessRuleViolationError } from '../../domain/exceptions';

export class ReimbursementBatchService {
  constructor(
    private readonly batchRepository: IReimbursementBatchRepository,
    private readonly paymentRepository: IReimbursementPaymentRepository,
    private readonly expenseRepository: IExpenseRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditRepository: IAuditLogRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly emailSender: IEmailSender
  ) {}

  public async createBatch(
    dto: CreateReimbursementBatchDto,
    authorId: string
  ): Promise<ReimbursementBatchResponseDto> {
    if (!dto.expenseIds || dto.expenseIds.length === 0) {
      throw new BusinessRuleViolationError('Nenhuma despesa selecionada para criação do lote');
    }

    const batchCode = await this.batchRepository.generateNextBatchCode();
    const batchId = uuidv4();
    const payments: ReimbursementPayment[] = [];

    for (const expenseId of dto.expenseIds) {
      const expense = await this.expenseRepository.findWithDetails(expenseId);
      if (!expense) {
        throw new NotFoundError('Despesa', expenseId);
      }

      if (expense.status !== ExpenseStatus.APPROVED_FOR_PAYMENT) {
        throw new BusinessRuleViolationError(
          `A despesa ${expense.code} está no status '${expense.status}' e não pode ser incluída em lote de pagamento.`
        );
      }

      const user = await this.userRepository.findById(expense.userId);
      if (!user) {
        throw new NotFoundError('Usuário beneficiário', expense.userId);
      }

      const paymentMethod = user.bankDetails?.preferredPaymentMethod || PaymentMethod.PIX;
      const payment = new ReimbursementPayment({
        id: uuidv4(),
        batchId,
        expenseId: expense.id,
        recipientId: user.id,
        amount: expense.reimbursableAmount,
        paymentMethod,
        bankDetailsSnapshot: user.bankDetails,
        status: PaymentStatus.PENDING,
      });

      payments.push(payment);

      expense.markPaymentScheduled();
      await this.expenseRepository.update(expense);
    }

    const scheduledDate = dto.scheduledDate ? new Date(dto.scheduledDate) : undefined;
    const batch = new ReimbursementBatch({
      id: batchId,
      batchCode,
      description: dto.description,
      status: PaymentStatus.PENDING,
      scheduledDate,
      payments,
    });

    const savedBatch = await this.batchRepository.save(batch);

    for (const p of payments) {
      await this.paymentRepository.save(p);
    }

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: authorId,
        action: AuditAction.REIMBURSEMENT_BATCH_CREATE,
        entityName: 'ReimbursementBatch',
        entityId: savedBatch.id,
        newValues: savedBatch.toJSON(),
      })
    );

    return this.mapToResponse(savedBatch);
  }

  public async getBatchById(id: string): Promise<ReimbursementBatchResponseDto> {
    const batch = await this.batchRepository.findWithPayments(id);
    if (!batch) {
      throw new NotFoundError('Lote de Reembolso', id);
    }
    return this.mapToResponse(batch);
  }

  public async processBatch(
    batchId: string,
    dto: ProcessBatchPaymentDto,
    processedById: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ReimbursementBatchResponseDto> {
    const batch = await this.batchRepository.findWithPayments(batchId);
    if (!batch) {
      throw new NotFoundError('Lote de Reembolso', batchId);
    }

    if (batch.status === PaymentStatus.COMPLETED) {
      throw new BusinessRuleViolationError('Este lote de reembolso já foi processado e concluído');
    }

    batch.markProcessing();
    await this.batchRepository.update(batch);

    const prefix = dto.transactionReferencePrefix || 'PIX-REF-';

    for (const payment of batch.payments) {
      const txRef = `${prefix}${Date.now()}-${payment.id.slice(0, 8).toUpperCase()}`;
      const receiptNum = `REC-${Date.now().toString().slice(-6)}`;

      payment.complete(txRef, receiptNum);
      await this.paymentRepository.update(payment);

      // Marca a despesa correspondente como paga
      const expense = await this.expenseRepository.findWithDetails(payment.expenseId);
      if (expense) {
        expense.markAsPaid();
        await this.expenseRepository.update(expense);

        // Notifica o colaborador
        const user = await this.userRepository.findById(payment.recipientId);
        if (user) {
          const notif = new Notification({
            id: uuidv4(),
            userId: user.id,
            type: NotificationType.EXPENSE_PAID,
            title: 'Reembolso Efetuado',
            message: `O reembolso da sua despesa ${expense.code} no valor de ${expense.totalAmount.format()} foi creditado.`,
            data: { expenseId: expense.id, transactionReference: txRef },
          });
          await this.notificationRepository.save(notif);

          const emailContent = EmailTemplates.expensePaid({
            userName: user.name,
            expenseCode: expense.code,
            expenseTitle: expense.title,
            totalAmount: expense.totalAmount.format(),
            transactionReference: txRef,
          });
          await this.emailSender.sendEmail({
            to: user.email.value,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });
        }
      }
    }

    batch.complete(processedById);
    await this.batchRepository.update(batch);

    await this.auditRepository.save(
      new AuditLog({
        id: uuidv4(),
        userId: processedById,
        action: AuditAction.REIMBURSEMENT_PROCESS,
        entityName: 'ReimbursementBatch',
        entityId: batch.id,
        newValues: batch.toJSON(),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(batch);
  }

  public async listPendingBatches(): Promise<ReimbursementBatchResponseDto[]> {
    const list = await this.batchRepository.findPendingBatches();
    return list.map((b) => this.mapToResponse(b));
  }

  private mapToResponse(batch: ReimbursementBatch): ReimbursementBatchResponseDto {
    return {
      id: batch.id,
      batchCode: batch.batchCode,
      description: batch.description,
      status: batch.status,
      totalAmount: batch.totalAmount.toJSON(),
      totalExpensesCount: batch.totalExpensesCount,
      scheduledDate: batch.scheduledDate,
      processedAt: batch.processedAt,
      processedById: batch.processedById,
      payments: batch.payments.map((p) => ({
        id: p.id,
        batchId: p.batchId,
        expenseId: p.expenseId,
        recipientId: p.recipientId,
        amount: p.amount.toJSON(),
        paymentMethod: p.paymentMethod,
        bankDetailsSnapshot: p.bankDetailsSnapshot ? (p.bankDetailsSnapshot.toJSON() as any) : null,
        status: p.status,
        transactionReference: p.transactionReference,
        receiptNumber: p.receiptNumber,
        failureReason: p.failureReason,
        executedAt: p.executedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}

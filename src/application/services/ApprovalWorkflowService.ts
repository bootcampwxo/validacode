import { v4 as uuidv4 } from 'uuid';
import { IApprovalWorkflowRepository } from '../../infrastructure/repositories/IApprovalWorkflowRepository';
import { IExpenseRepository } from '../../infrastructure/repositories/IExpenseRepository';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { IDepartmentRepository } from '../../infrastructure/repositories/IDepartmentRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/IAuditLogRepository';
import { INotificationRepository } from '../../infrastructure/repositories/INotificationRepository';
import { IEmailSender } from '../../infrastructure/notifications/IEmailSender';
import { EmailTemplates } from '../../infrastructure/notifications/EmailTemplates';
import {
  ApprovalWorkflowResponseDto,
  ApproveExpenseDto,
  RejectExpenseDto,
  RequestRevisionDto,
} from '../dtos/approval.dto';
import { ApprovalWorkflow } from '../../domain/entities/ApprovalWorkflow';
import { ApprovalStep } from '../../domain/entities/ApprovalStep';
import { ApprovalAction } from '../../domain/entities/ApprovalAction';
import { Expense } from '../../domain/entities/Expense';
import { Notification } from '../../domain/entities/Notification';
import { AuditLog } from '../../domain/entities/AuditLog';
import {
  ApprovalLevel,
  ApprovalStatus,
  AuditAction,
  ExpenseStatus,
  NotificationType,
  UserRole,
} from '../../domain/enums';
import { Money } from '../../domain/value-objects';
import { NotFoundError, ForbiddenError, BusinessRuleViolationError } from '../../domain/exceptions';
import { config } from '../../config';

export class ApprovalWorkflowService {
  constructor(
    private readonly workflowRepository: IApprovalWorkflowRepository,
    private readonly expenseRepository: IExpenseRepository,
    private readonly userRepository: IUserRepository,
    private readonly departmentRepository: IDepartmentRepository,
    private readonly auditRepository: IAuditLogRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly emailSender: IEmailSender
  ) {}

  public async startWorkflow(expense: Expense): Promise<ApprovalWorkflow> {
    const requester = await this.userRepository.findById(expense.userId);
    const department = await this.departmentRepository.findById(expense.departmentId);

    const workflowId = uuidv4();
    const steps: ApprovalStep[] = [];
    let stepOrder = 1;

    // Etapa 1: Gestor Direto (Manager)
    const managerId = requester?.managerId || department?.managerId;
    steps.push(
      new ApprovalStep({
        id: uuidv4(),
        workflowId,
        stepOrder: stepOrder++,
        level: ApprovalLevel.LEVEL_1_MANAGER,
        approverId: managerId,
        status: ApprovalStatus.PENDING,
      })
    );

    // Etapa 2: Diretor (se valor > diretor threshold ex: R$ 5.000,00)
    const directorThreshold = Money.fromDecimal(config.policies.directorApprovalThreshold);
    if (expense.totalAmount.isGreaterThan(directorThreshold)) {
      const directorId = department?.directorId;
      steps.push(
        new ApprovalStep({
          id: uuidv4(),
          workflowId,
          stepOrder: stepOrder++,
          level: ApprovalLevel.LEVEL_2_DIRECTOR,
          approverId: directorId,
          thresholdAmount: directorThreshold,
          status: ApprovalStatus.PENDING,
        })
      );
    }

    // Etapa 3: VP / Vice-Presidente (se valor > VP threshold ex: R$ 20.000,00)
    const vpThreshold = Money.fromDecimal(config.policies.vpApprovalThreshold);
    if (expense.totalAmount.isGreaterThan(vpThreshold)) {
      steps.push(
        new ApprovalStep({
          id: uuidv4(),
          workflowId,
          stepOrder: stepOrder++,
          level: ApprovalLevel.LEVEL_3_VP,
          thresholdAmount: vpThreshold,
          status: ApprovalStatus.PENDING,
        })
      );
    }

    // Etapa 4: Validação e Liberação Financeira (Finance / Controladoria)
    steps.push(
      new ApprovalStep({
        id: uuidv4(),
        workflowId,
        stepOrder: stepOrder++,
        level: ApprovalLevel.LEVEL_4_FINANCE,
        status: ApprovalStatus.PENDING,
      })
    );

    const workflow = new ApprovalWorkflow({
      id: workflowId,
      expenseId: expense.id,
      status: ApprovalStatus.PENDING,
      currentStepOrder: 1,
      totalSteps: steps.length,
      steps,
    });

    await this.workflowRepository.save(workflow);

    // Notifica o primeiro aprovador
    const firstStep = workflow.getCurrentStep();
    if (firstStep && firstStep.approverId) {
      await this.notifyApprover(firstStep.approverId, expense);
    }

    return workflow;
  }

  public async approve(
    expenseId: string,
    approverId: string,
    dto: ApproveExpenseDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.workflowRepository.findByExpenseId(expenseId);
    if (!workflow) {
      throw new NotFoundError('Fluxo de aprovação da despesa', expenseId);
    }

    const currentStep = workflow.getCurrentStep();
    if (!currentStep) {
      throw new BusinessRuleViolationError('Não há etapas de aprovação pendentes no fluxo');
    }

    const approver = await this.userRepository.findById(approverId);
    if (!approver) {
      throw new NotFoundError('Usuário aprovador', approverId);
    }

    // Valida permissão do aprovador
    const canApprove =
      approver.hasRole(UserRole.ADMIN) ||
      currentStep.approverId === approverId ||
      (currentStep.level === ApprovalLevel.LEVEL_4_FINANCE &&
        (approver.hasRole(UserRole.FINANCIAL_MANAGER) || approver.hasRole(UserRole.FINANCIAL_ANALYST))) ||
      (currentStep.level === ApprovalLevel.LEVEL_3_VP && approver.hasRole(UserRole.VP)) ||
      (currentStep.level === ApprovalLevel.LEVEL_2_DIRECTOR && approver.hasRole(UserRole.DIRECTOR));

    if (!canApprove) {
      throw new ForbiddenError('Você não tem permissão para aprovar a etapa atual deste fluxo');
    }

    currentStep.approve(approverId, dto.comments);
    await this.workflowRepository.updateStep(currentStep);

    // Registra ação de auditoria
    await this.workflowRepository.recordAction(
      new ApprovalAction({
        id: uuidv4(),
        stepId: currentStep.id,
        workflowId: workflow.id,
        expenseId,
        actorId: approverId,
        action: ApprovalStatus.APPROVED,
        comments: dto.comments,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (!expense) throw new NotFoundError('Despesa', expenseId);

    const hasNext = workflow.proceedToNextStep();
    if (hasNext) {
      // Atualiza status da despesa conforme nível
      if (currentStep.level === ApprovalLevel.LEVEL_1_MANAGER) {
        expense.markApprovedByManager();
      } else if (currentStep.level === ApprovalLevel.LEVEL_2_DIRECTOR) {
        expense.markApprovedByDirector();
      } else if (currentStep.level === ApprovalLevel.LEVEL_3_VP) {
        expense.markApprovedByVp();
      }
      await this.expenseRepository.update(expense);

      const nextStep = workflow.getCurrentStep();
      if (nextStep && nextStep.approverId) {
        await this.notifyApprover(nextStep.approverId, expense);
      }
    } else {
      // Todas as etapas foram aprovadas!
      expense.markApprovedForPayment();
      await this.expenseRepository.update(expense);

      // Notifica o solicitante da aprovação completa
      const requester = await this.userRepository.findById(expense.userId);
      if (requester) {
        const notif = new Notification({
          id: uuidv4(),
          userId: requester.id,
          type: NotificationType.EXPENSE_APPROVED,
          title: 'Reembolso Aprovado',
          message: `Sua despesa ${expense.code} foi aprovada em todas as instâncias!`,
          data: { expenseId: expense.id, code: expense.code },
        });
        await this.notificationRepository.save(notif);

        const emailContent = EmailTemplates.expenseApproved({
          userName: requester.name,
          expenseCode: expense.code,
          expenseTitle: expense.title,
          totalAmount: expense.totalAmount.format(),
        });
        await this.emailSender.sendEmail({
          to: requester.email.value,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
      }
    }

    await this.workflowRepository.update(workflow);

    return this.mapToResponse(workflow);
  }

  public async reject(
    expenseId: string,
    approverId: string,
    dto: RejectExpenseDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.workflowRepository.findByExpenseId(expenseId);
    if (!workflow) {
      throw new NotFoundError('Fluxo de aprovação da despesa', expenseId);
    }

    const currentStep = workflow.getCurrentStep();
    if (!currentStep) {
      throw new BusinessRuleViolationError('Não há etapas de aprovação ativas');
    }

    currentStep.reject(approverId, dto.reason);
    await this.workflowRepository.updateStep(currentStep);

    workflow.rejectWorkflow();
    await this.workflowRepository.update(workflow);

    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (expense) {
      expense.reject(dto.reason);
      await this.expenseRepository.update(expense);

      const requester = await this.userRepository.findById(expense.userId);
      if (requester) {
        const notif = new Notification({
          id: uuidv4(),
          userId: requester.id,
          type: NotificationType.EXPENSE_REJECTED,
          title: 'Despesa Rejeitada',
          message: `Sua despesa ${expense.code} foi rejeitada. Motivo: ${dto.reason}`,
          data: { expenseId: expense.id, reason: dto.reason },
        });
        await this.notificationRepository.save(notif);
      }
    }

    await this.workflowRepository.recordAction(
      new ApprovalAction({
        id: uuidv4(),
        stepId: currentStep.id,
        workflowId: workflow.id,
        expenseId,
        actorId: approverId,
        action: ApprovalStatus.REJECTED,
        comments: dto.reason,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(workflow);
  }

  public async requestRevision(
    expenseId: string,
    approverId: string,
    dto: RequestRevisionDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.workflowRepository.findByExpenseId(expenseId);
    if (!workflow) {
      throw new NotFoundError('Fluxo de aprovação da despesa', expenseId);
    }

    const currentStep = workflow.getCurrentStep();
    if (!currentStep) {
      throw new BusinessRuleViolationError('Não há etapas de aprovação ativas');
    }

    currentStep.requestRevision(approverId, dto.instructions);
    await this.workflowRepository.updateStep(currentStep);

    workflow.requestRevisionWorkflow();
    await this.workflowRepository.update(workflow);

    const expense = await this.expenseRepository.findWithDetails(expenseId);
    if (expense) {
      expense.requestRevision(dto.instructions);
      await this.expenseRepository.update(expense);

      const requester = await this.userRepository.findById(expense.userId);
      if (requester) {
        const notif = new Notification({
          id: uuidv4(),
          userId: requester.id,
          type: NotificationType.EXPENSE_REVISION_REQUESTED,
          title: 'Revisão Solicitada',
          message: `Sua despesa ${expense.code} necessita de ajustes: ${dto.instructions}`,
          data: { expenseId: expense.id, instructions: dto.instructions },
        });
        await this.notificationRepository.save(notif);
      }
    }

    await this.workflowRepository.recordAction(
      new ApprovalAction({
        id: uuidv4(),
        stepId: currentStep.id,
        workflowId: workflow.id,
        expenseId,
        actorId: approverId,
        action: ApprovalStatus.RETURNED_FOR_REVISION,
        comments: dto.instructions,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      })
    );

    return this.mapToResponse(workflow);
  }

  public async getWorkflowByExpenseId(expenseId: string): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.workflowRepository.findByExpenseId(expenseId);
    if (!workflow) {
      throw new NotFoundError('Fluxo de aprovação da despesa', expenseId);
    }
    return this.mapToResponse(workflow);
  }

  private async notifyApprover(approverId: string, expense: Expense): Promise<void> {
    const approver = await this.userRepository.findById(approverId);
    const requester = await this.userRepository.findById(expense.userId);

    if (approver && requester) {
      const notif = new Notification({
        id: uuidv4(),
        userId: approver.id,
        type: NotificationType.APPROVAL_ASSIGNED,
        title: 'Nova Aprovação Pendente',
        message: `Despesa ${expense.code} de ${requester.name} aguarda sua aprovação.`,
        data: { expenseId: expense.id, code: expense.code },
      });
      await this.notificationRepository.save(notif);

      const emailContent = EmailTemplates.approvalRequired({
        approverName: approver.name,
        requesterName: requester.name,
        expenseCode: expense.code,
        expenseTitle: expense.title,
        totalAmount: expense.totalAmount.format(),
        approvalUrl: `${config.app.url}/expenses/${expense.id}/review`,
      });

      await this.emailSender.sendEmail({
        to: approver.email.value,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    }
  }

  private mapToResponse(wf: ApprovalWorkflow): ApprovalWorkflowResponseDto {
    return {
      id: wf.id,
      expenseId: wf.expenseId,
      status: wf.status,
      currentStepOrder: wf.currentStepOrder,
      totalSteps: wf.totalSteps,
      steps: wf.steps.map((s) => ({
        id: s.id,
        workflowId: s.workflowId,
        stepOrder: s.stepOrder,
        level: s.level,
        approverId: s.approverId,
        approverRoleId: s.approverRoleId,
        status: s.status,
        thresholdAmount: s.thresholdAmount ? s.thresholdAmount.toJSON() : null,
        assignedAt: s.assignedAt,
        decidedAt: s.decidedAt,
        comments: s.comments,
        isAutoApproved: s.isAutoApproved,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      startedAt: wf.startedAt,
      completedAt: wf.completedAt,
      isComplete: wf.isComplete(),
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    };
  }
}

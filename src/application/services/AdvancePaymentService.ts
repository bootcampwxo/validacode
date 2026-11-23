import { v4 as uuidv4 } from 'uuid';
import { IAdvancePaymentRepository, AdvanceFilterParams } from '../../infrastructure/repositories/IAdvancePaymentRepository';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { IDepartmentRepository } from '../../infrastructure/repositories/IDepartmentRepository';
import {
  CreateAdvancePaymentDto,
  ApproveAdvanceDto,
  RejectAdvanceDto,
  AdvancePaymentResponseDto,
} from '../dtos/advance.dto';
import { AdvancePayment } from '../../domain/entities/AdvancePayment';
import { Money } from '../../domain/value-objects';
import { Currency, AdvanceStatus, UserRole } from '../../domain/enums';
import { NotFoundError, ForbiddenError } from '../../domain/exceptions';
import { PaginatedResult } from '../../infrastructure/database/QueryBuilder';

export class AdvancePaymentService {
  constructor(
    private readonly advanceRepository: IAdvancePaymentRepository,
    private readonly userRepository: IUserRepository,
    private readonly departmentRepository: IDepartmentRepository
  ) {}

  public async requestAdvance(
    userId: string,
    dto: CreateAdvancePaymentDto
  ): Promise<AdvancePaymentResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }

    const departmentId = dto.departmentId || user.departmentId || '22222222-2222-2222-2222-222222222201';
    const dept = await this.departmentRepository.findById(departmentId);
    const costCenterId = dto.costCenterId || dept?.costCenterId || '11111111-1111-1111-1111-111111111101';

    const nextCode = await this.advanceRepository.generateNextCode();
    const currency = dto.currency || Currency.BRL;

    const advance = new AdvancePayment({
      id: uuidv4(),
      code: nextCode,
      userId,
      departmentId,
      costCenterId,
      purpose: dto.purpose,
      requestedAmount: Money.fromDecimal(dto.requestedAmount, currency),
      currency,
      status: AdvanceStatus.PENDING,
      requestDate: new Date(),
      expectedReconciliationDate: new Date(dto.expectedReconciliationDate),
    });

    const saved = await this.advanceRepository.save(advance);
    return this.mapToResponse(saved);
  }

  public async approveAdvance(
    id: string,
    approverId: string,
    dto: ApproveAdvanceDto
  ): Promise<AdvancePaymentResponseDto> {
    const advance = await this.advanceRepository.findById(id);
    if (!advance) {
      throw new NotFoundError('Solicitação de Adiantamento', id);
    }

    const approver = await this.userRepository.findById(approverId);
    if (!approver || (!approver.hasRole(UserRole.DIRECTOR) && !approver.hasRole(UserRole.FINANCIAL_MANAGER) && !approver.hasRole(UserRole.ADMIN))) {
      throw new ForbiddenError('Apenas diretores ou gestores financeiros podem aprovar adiantamentos');
    }

    const approvedAmount = dto.approvedAmount
      ? Money.fromDecimal(dto.approvedAmount, advance.currency)
      : undefined;

    advance.approve(approverId, approvedAmount);
    const updated = await this.advanceRepository.update(advance);
    return this.mapToResponse(updated);
  }

  public async rejectAdvance(
    id: string,
    approverId: string,
    dto: RejectAdvanceDto
  ): Promise<AdvancePaymentResponseDto> {
    const advance = await this.advanceRepository.findById(id);
    if (!advance) {
      throw new NotFoundError('Solicitação de Adiantamento', id);
    }

    advance.reject(dto.reason);
    const updated = await this.advanceRepository.update(advance);
    return this.mapToResponse(updated);
  }

  public async markDisbursed(id: string): Promise<AdvancePaymentResponseDto> {
    const advance = await this.advanceRepository.findById(id);
    if (!advance) {
      throw new NotFoundError('Solicitação de Adiantamento', id);
    }

    advance.markDisbursed();
    const updated = await this.advanceRepository.update(advance);
    return this.mapToResponse(updated);
  }

  public async searchAdvances(filters: AdvanceFilterParams): Promise<PaginatedResult<AdvancePaymentResponseDto>> {
    const result = await this.advanceRepository.searchAdvances(filters);
    return {
      data: result.data.map((a) => this.mapToResponse(a)),
      pagination: result.pagination,
    };
  }

  private mapToResponse(a: AdvancePayment): AdvancePaymentResponseDto {
    return {
      id: a.id,
      code: a.code,
      userId: a.userId,
      departmentId: a.departmentId,
      costCenterId: a.costCenterId,
      purpose: a.purpose,
      requestedAmount: a.requestedAmount.toJSON(),
      approvedAmount: a.approvedAmount ? a.approvedAmount.toJSON() : null,
      currency: a.currency,
      status: a.status,
      requestDate: a.requestDate,
      expectedReconciliationDate: a.expectedReconciliationDate,
      actualReconciliationDate: a.actualReconciliationDate,
      approvedById: a.approvedById,
      approvedAt: a.approvedAt,
      disbursedAt: a.disbursedAt,
      rejectionReason: a.rejectionReason,
      reconciledExpenseId: a.reconciledExpenseId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

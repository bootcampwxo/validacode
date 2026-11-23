import { BaseEntity } from './BaseEntity';
import { ApprovalLevel, ApprovalStatus } from '../enums';
import { Money } from '../value-objects';
import { ValidationError, BusinessRuleViolationError } from '../exceptions';

export interface ApprovalStepProps {
  id: string;
  workflowId: string;
  stepOrder: number;
  level: ApprovalLevel;
  approverId?: string;
  approverRoleId?: string;
  status?: ApprovalStatus;
  thresholdAmount?: Money;
  assignedAt?: Date;
  decidedAt?: Date;
  comments?: string;
  isAutoApproved?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ApprovalStep extends BaseEntity {
  private _workflowId: string;
  private _stepOrder: number;
  private _level: ApprovalLevel;
  private _approverId?: string;
  private _approverRoleId?: string;
  private _status: ApprovalStatus;
  private _thresholdAmount?: Money;
  private _assignedAt?: Date;
  private _decidedAt?: Date;
  private _comments?: string;
  private _isAutoApproved: boolean;

  constructor(props: ApprovalStepProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._workflowId = props.workflowId;
    this._stepOrder = props.stepOrder;
    this._level = props.level;
    this._approverId = props.approverId;
    this._approverRoleId = props.approverRoleId;
    this._status = props.status || ApprovalStatus.PENDING;
    this._thresholdAmount = props.thresholdAmount;
    this._assignedAt = props.assignedAt;
    this._decidedAt = props.decidedAt;
    this._comments = props.comments;
    this._isAutoApproved = props.isAutoApproved || false;
  }

  public get workflowId(): string {
    return this._workflowId;
  }

  public get stepOrder(): number {
    return this._stepOrder;
  }

  public get level(): ApprovalLevel {
    return this._level;
  }

  public get approverId(): string | undefined {
    return this._approverId;
  }

  public get approverRoleId(): string | undefined {
    return this._approverRoleId;
  }

  public get status(): ApprovalStatus {
    return this._status;
  }

  public get thresholdAmount(): Money | undefined {
    return this._thresholdAmount;
  }

  public get assignedAt(): Date | undefined {
    return this._assignedAt;
  }

  public get decidedAt(): Date | undefined {
    return this._decidedAt;
  }

  public get comments(): string | undefined {
    return this._comments;
  }

  public get isAutoApproved(): boolean {
    return this._isAutoApproved;
  }

  public assignApprover(approverId: string): void {
    this._approverId = approverId;
    this._assignedAt = new Date();
    this.touch();
  }

  public approve(approverId: string, comments?: string): void {
    if (this._status !== ApprovalStatus.PENDING) {
      throw new BusinessRuleViolationError(`Etapa de aprovação já se encontra no status '${this._status}'`);
    }
    this._approverId = approverId;
    this._status = ApprovalStatus.APPROVED;
    this._decidedAt = new Date();
    this._comments = comments;
    this.touch();
  }

  public autoApprove(reason = 'Aprovação automática por regra de baixo valor'): void {
    this._status = ApprovalStatus.AUTO_APPROVED;
    this._isAutoApproved = true;
    this._decidedAt = new Date();
    this._comments = reason;
    this.touch();
  }

  public reject(approverId: string, reason: string): void {
    if (this._status !== ApprovalStatus.PENDING) {
      throw new BusinessRuleViolationError(`Etapa de aprovação já se encontra no status '${this._status}'`);
    }
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Motivo da rejeição é obrigatório');
    }
    this._approverId = approverId;
    this._status = ApprovalStatus.REJECTED;
    this._decidedAt = new Date();
    this._comments = reason.trim();
    this.touch();
  }

  public requestRevision(approverId: string, instructions: string): void {
    if (this._status !== ApprovalStatus.PENDING) {
      throw new BusinessRuleViolationError(`Etapa de aprovação já se encontra no status '${this._status}'`);
    }
    if (!instructions || instructions.trim().length === 0) {
      throw new ValidationError('Instruções de revisão são obrigatórias');
    }
    this._approverId = approverId;
    this._status = ApprovalStatus.RETURNED_FOR_REVISION;
    this._decidedAt = new Date();
    this._comments = instructions.trim();
    this.touch();
  }

  public skip(): void {
    this._status = ApprovalStatus.SKIPPED;
    this._decidedAt = new Date();
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      workflowId: this._workflowId,
      stepOrder: this._stepOrder,
      level: this._level,
      approverId: this._approverId,
      approverRoleId: this._approverRoleId,
      status: this._status,
      thresholdAmount: this._thresholdAmount ? this._thresholdAmount.toJSON() : null,
      assignedAt: this._assignedAt,
      decidedAt: this._decidedAt,
      comments: this._comments,
      isAutoApproved: this._isAutoApproved,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
